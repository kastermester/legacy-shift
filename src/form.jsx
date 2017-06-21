Shift.EditorFor = ShiftEditorFor = React.createClass({
	getDefaultProps: function () {
		return {
			clearValueOnUnmount: false
		};
	},
	render: function () { throw new Error("Should not be rendered") }
});
Shift.ValidationMessageFor = ShiftValidationMessageFor = React.createClass({
	render: function () { throw new Error("Should not be rendered") }
});
Shift.IfEditValueForEquals = ShiftIfValueForEquals = React.createClass({
	render: function () { throw new Error("Should not be rendered") }
});

Shift.Form = ShiftForm = React.createClass({
	mixins: [Shift.Mixins.events, Shift.Mixins.translate],
	propTypes: {
		events: React.PropTypes.shape({
			onSubmit: React.PropTypes.function,
			onChange: React.PropTypes.function,
			onFieldInFocusChange: React.PropTypes.function,
			onSubmitBegin: React.PropTypes.function,
			onSubmitEnd: React.PropTypes.function
		}),
		fields: React.PropTypes.arrayOf(React.PropTypes.string),
		submitButtonId: React.PropTypes.string
	},
	getDefaultProps: function () {
		return {
			initialValue: {},
			idPrefix: 'form-',
			locale: 'en_US',
			context: null,
			submitButtonId: null,
			LabelComponent: ShiftLabel,
			TitleComponent: ShiftTitle
		};
	},
	translateCategoryName: function (category) {
		if (this.props.categoryTranslations) {
			if (this.props.categoryTranslations[this.props.locale]) {
				category = this.props.categoryTranslations[this.props.locale][category];
			}
		}

		if (this.props.TitleComponent != null) {
			var TitleComponent = this.props.TitleComponent;
			return <TitleComponent text={category} locale={this.props.locale} />;
		}

		return category;
	},
	getInitialState: function () {
		return {
			fieldInFocus: null,
			fieldErrors: this.getEmptyFieldErrors(this.props),
			submittedOnce: false,
			presenterValues: this.props.initialValue || {}
		};
	},

	getEmptyFieldErrors: function (props) {
		var result = {};

		for(var key in this.props.schema){
			result[key] = {};
		}

		return result;
	},

	addArtificialRef: function (fieldName, ref) {
		this.artificialRefs[fieldName] = ref;
		delete this.newValues[fieldName];
	},
	removeArtificialRef: function (fieldName, clearValue) {
		if (this.newValues != null) {
			if (clearValue) {
				delete this.newValues[fieldName];
			} else {
				if (this.newValues[fieldName] === undefined) {
					this.newValues[fieldName] = this.artificialRefs[fieldName].getValue();
				}
			}
		}
		delete this.artificialRefs[fieldName];
	},
	componentWillMount: function () {
		this.artificialRefs = {};
		this.newValues = {};
		this.setupValidatorState(this.props);
	},
	setupValidatorState: function (props) {
		this.validators = {};
		this.validatorsWithDependencies = {};
		this.validatorsDependingOnField = {};
		// We save this here as non-state.
		// React updates the state in some weird asynchronous way
		// we need a synchronous way of reading the state
		this.fieldErrors = this.getEmptyFieldErrors(props);

		for (var field in props.schema) {
			this.validators[field] = [];
			this.validatorsDependingOnField[field] = [];
			this.validatorsWithDependencies[field] = [];
		}

		for (var field in props.schema) {
			var schema = props.schema[field];
			if (schema.validators instanceof Array) {
				var validators = this.normalizeValidators(schema.validators);
				for (var i in validators) {
					var validator = validators[i];
					if (Object.keys(validator.dependencies).length == 0) {
						this.validators[field].push(validator);
					} else {
						this.validatorsWithDependencies[field].push(validator);
						for (var key in validator.dependencies) {
							var otherField = validator.dependencies[key];
							this.validatorsDependingOnField[otherField].push({ field: field, validator: validator });
						}
					}
				}
			}
		}
	},
	componentWillUnmount: function () {
		this.validators = null;
		this.validatorsDependingOnField = null;
		this.fieldErrors = null;
		this.editors = null;
		this.newValues = null;
		this.mounted = false;
	},

	componentDidMount: function () {
		this.mounted = true;
	},
	defaultTemplate: [<div key="container">
		<ShiftFieldsFor key='fields'>
			<ShiftValidationClassStatusFor errorClassName='validation-error'>
				<ShiftLabelFor key='label' />
				<ShiftEditorFor key='editor' />
				<ShiftValidationMessageFor key='validation' />
			</ShiftValidationClassStatusFor>
		</ShiftFieldsFor>
		<ShiftCategoryFor key='category'>
			<fieldset>
				<ShiftCategoryNameFor tagName='legend' key='category-name' />
				<ShiftFieldsFor key='fields'>
					<ShiftValidationClassStatusFor
						errorClassName='validation-error'
						key="field"
					>
						<ShiftLabelFor key='label' />
						<ShiftEditorFor key='editor' />
						<ShiftValidationMessageFor key='validation' />
					</ShiftValidationClassStatusFor>
				</ShiftFieldsFor>
			</fieldset>
		</ShiftCategoryFor>
	</div>],

	getTemplate: function () {
		var template = this.props.template || this.props.children || this.defaultTemplate;
		if (template instanceof Array) {
			template = template.slice(0);
		} else {
			template = [template];
		}
		// This button is here to enable the browsers default auto-submit form behavior
		// Doing it in this odd fashion seems to be the only reliable way of getting it to work in all browsers
		// even if there's no other submit button in the form. Safari won't accept a button with display:none
		// and IE11 even fails with visibility hidden
		template.push(<input key='shift-submit' type='submit' style={{
			height: 0,
			width: 0,
			display: 'inline',
			margin: 0,
			padding: 0,
			borderWidth: 0
		}} />);
		return <form onSubmit={this.formSubmitted}>{template}</form>;
	},
	normalizeValidators: function (validators) {
		return validators.map(function (e) {
			if (['string', 'function'].indexOf(typeof (e)) >= 0) {
				return new Shift.Validator(e, {}, {});
			}

			if (e instanceof Shift.Validator) {
				return e;
			}

			var type = e.type;
			var params = e.params;
			var dependencies = e.dependencies;
			return new Shift.Validator(type, params, dependencies);
		});
	},
	getFields: function () {
		var fields = this.props.fields || Object.keys(this.props.schema);

		var result = [];

		for (var i in fields) {
			var field = fields[i];

			if (this.props.schema[field].editor) {
				result.push(field);
			}
		}

		return result;
	},
	getCategories: function () {
		var categories = this.props.categories || {};

		var result = {};

		for (var categoryName in categories) {
			var fieldNames = categories[categoryName];

			var fields = [];

			for (var i in fieldNames) {
				var field = fieldNames[i];

				if (this.props.schema[field].editor) {
					fields.push(field);
				}
			}

			if (fields.length > 0) {
				result[categoryName] = fields;
			}
		}

		return result;
	},
	render: function () {
		var that = this;
		var template = this.getTemplate();

		var templateMap = this.getTemplateMap();

		var result = utils.templateHelper(template, this.getFields(), this.getCategories(), function (category) {
			return that.translateCategoryName(category);
		}, templateMap, this.getFieldValue, this.props.context, this.props.schema, this.isFieldValid, this.getFieldErrorMessage, this);

		var editors = [];

		utils.templateHelper.forEachEditor(result, function (e) {
			editors.push(e.props.fieldName);
		});

		this.editors = editors;

		return result;
	},

	isFieldValid: function (fieldName) {
		return typeof (this.state.fieldErrors[fieldName]) == 'undefined' || Object.keys(this.state.fieldErrors[fieldName]).length == 0;
	},

	getFieldErrorMessage: function (fieldName, translate) {
		var err = this.state.fieldErrors[fieldName];

		var keys = Object.keys(err);

		if (keys.length == 0) {
			return '';
		}

		if (translate) {
			return this.translate(err[keys[0]]);
		} else {
			return err[keys[0]];
		}
	},
	generateEditorId: function (fieldName) {
		return this.props.idPrefix + fieldName;
	},
	getInitialFieldValue: function (fieldName) {
		if (this.newValues[fieldName] !== undefined) {
			return this.newValues[fieldName];
		}
		var initialValue = this.props.initialValue || {};
		return utils.getIn(initialValue, fieldName);
	},
	getPresenterFieldValue: function (fieldName) {
		return utils.getIn(this.state.presenterValues, fieldName);
	},
	getTemplateMap: function () {
		var that = this;
		var result = [];

		var addArtificialRef = this.addArtificialRef;
		var removeArtificialRef = this.removeArtificialRef;

		result.push(Shift.EditorFor);
		result.push(function (fieldName, reactNode) {
			var field = that.props.schema[fieldName];
			var initialValue = function () {
				var v = that.getInitialFieldValue(fieldName);
				if (!utils.isEmptyValue(v)) {
					return v;
				}

				return undefined;
			};
			var opts = {
				className: utils.maybeAppendErrorClassNames(
					reactNode.props.className,
					reactNode.props.errorClassName,
					that.isFieldValid(fieldName)
				),
				context: that.props.context,
				locale: that.props.locale,
				editorId: that.generateEditorId(fieldName),
				submit: that.submit,
				focusNext: that.focusNext,
				focusPrevious: that.focusPrevious,
				field: fieldName,
				events: {
					onChange: function (oldValue, newValue) {
						that.valueChanged(fieldName, oldValue, newValue);
					},
					onFocus: function () {
						that.fieldFocused(fieldName);
					},
					onBlur: function () {
						that.fieldBlurred(fieldName);
					}
				}
			};

			var origProps = utils.extend({}, reactNode.props);
			delete origProps.field;
			return <ShiftEditor
				fieldName={fieldName}
				initialValue={initialValue}
				addRef={addArtificialRef}
				removeRef={removeArtificialRef}
				clearValueOnUnmount={reactNode.props.clearValueOnUnmount}
				key={'editor-' + fieldName + (reactNode.key ? ('-' + reactNode.key) : '')}
				child={React.createElement(utils.unwrapEditor(field.editor), (utils.extend({}, origProps, field.editorProps, opts)))}
			/>
		});

		result.push(Shift.LabelFor);
		result.push(function (fieldName, reactNode) {
			var field = that.props.schema[fieldName];
			var tagName = reactNode.props.tagName;
			var className = reactNode.props.className;
			var errorClassName = reactNode.props.errorClassName;
			var label = field.label;

			if (field.editorLabel) {
				label = field.editorLabel;
			}
			var LabelComponent = that.props.LabelComponent;
			return <LabelComponent
				tagName={tagName}
				text={LabelComponent == ShiftLabel ? that.translate(label) : label}
				editorId={that.generateEditorId(fieldName)}
				locale={that.props.locale}
				key={'label-' + fieldName}
				className={utils.maybeAppendErrorClassNames(
					className,
					errorClassName,
					that.isFieldValid(fieldName)
				)}
			/>;
		});

		result.push(Shift.ValidationMessageFor);
		result.push(function (fieldName, reactNode) {
			var className = reactNode.props.className;
			var tagName = reactNode.props.tagName ? reactNode.props.tagName : 'span';
			var errorClassName = reactNode.props.errorClassName;
			var isValid = that.isFieldValid(fieldName);
			var LabelComponent = that.props.LabelComponent;
			var msg = that.getFieldErrorMessage(fieldName, LabelComponent == ShiftLabel);

			return <LabelComponent
				tagName={tagName}
				text={msg}
				locale={that.props.locale}
				key={'validation-message-' + fieldName}
				className={utils.maybeAppendErrorClassNames(
					className,
					errorClassName,
					that.isFieldValid(fieldName)
				)}
			/>
		});

		result.push(Shift.ValidationClassStatusFor);
		result.push(function (fieldName, reactNode) {
			var className = reactNode.props.className;
			var tagName = reactNode.props.tagName;
			var errorClassName = reactNode.props.errorClassName;
			var isValid = that.isFieldValid(fieldName);

			var children = reactNode.props.children;
			if (Object.prototype.toString.call(children) !== '[object Array]') {
				children = [children];
			}

			return <ShiftValidationClassStatus
				tagName={tagName}
				key={'validation-class-status-' + fieldName}
				className={utils.maybeAppendErrorClassNames(
					className,
					errorClassName,
					that.isFieldValid(fieldName)
				)}
			>{
					children.map(function (child) {
						return utils.templateHelper.replaceExplicitFields([], [], function (category) {
							return that.translateCategoryName(category);
						}, child, result, fieldName, null, that.getFieldValue, that.props.context, that.props.schema, that.isFieldValid, that.getFieldErrorMessage, that);
					})
				}</ShiftValidationClassStatus>;
		});

		result.push(Shift.PresenterFor);
		result.push(function (fieldName, reactNode) {
			var field = that.props.schema[fieldName];
			var origProps = utils.extend({}, reactNode.props);
			delete origProps.field;
			return React.createElement(utils.unwrapPresenter(field.presenter), (utils.extend({}, origProps, field.presenterProps, {
				key: 'presenter-' + fieldName,
				value: that.getPresenterFieldValue(fieldName),
				className: reactNode.props.className,
				locale: that.props.locale,
				context: that.props.context,
				field: fieldName,
			})));
		});

		result.push(Shift.TitleFor);
		result.push(function (fieldName, reactNode) {
			var field = that.props.schema[fieldName];
			var tagName = reactNode.props.tagName;
			var className = reactNode.props.className;
			var TitleComponent = that.props.TitleComponent;
			return <TitleComponent
				locale={that.props.locale}
				tagName={tagName}
				key={'title-' + fieldName}
				text={TitleComponent == ShiftTitle ? that.translate(field.label) : field.label}
				className={className}
			/>;
		});

		result.push(Shift.IfNonEmptyValueFor);
		result.push(function (fieldName, reactNode) {
			var fieldValue = that.state.presenterValues[fieldName];
			if (utils.isEmptyValue(fieldValue)) {
				return null;
			}

			return reactNode.props.children;
		});

		result.push(Shift.IfEmptyValueFor);
		result.push(function (fieldName, reactNode) {
			var fieldValue = that.state.presenterValues[fieldName];
			if (utils.isEmptyValue(fieldValue)) {
				return reactNode.props.children;
			}

			return null;
		});

		result.push(Shift.IfEditValueForEquals);
		result.push(function (fieldName, reactNode) {
			var fieldValue = that.getFieldValue(fieldName);
			if (fieldValue == reactNode.props.value) {
				return reactNode.props.children;
			}

			return null;
		});

		return result;
	},

	formSubmitted: function (e) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.state.submitting) {
			this.submit(null, true);
		}
	},

	componentWillUpdate: function (nextProps, nextState) {
		if (nextState.submitting != this.state.submitting) {
			var submitButton = nextProps.submitButtonId ? document.getElementById(nextProps.submitButtonId) : null;
			if (nextState.submitting) {
				if (submitButton) {
					submitButton.disabled = 'disabled';
				}
				this.triggerEvent('onSubmitBegin');
			} else {
				if (submitButton) {
					submitButton.removeAttribute("disabled");
				}
				this.triggerEvent('onSubmitEnd');
			}
		}

		if (nextProps.schema !== this.props.schema) {
			this.setupValidatorState(nextProps);
		}
	},

	submit: function () {
		var defer = Shift.defer();
		var values = this.getValue();
		var that = this;
		this.setState({ submitting: true, submittedOnce: true });
		this.validate(values).then(function () {
			if (that.hasEvent('onSubmit')) {
				utils.async.whenAll([utils.ensurePromise(function () {
					return that.triggerEvent('onSubmit', [values]);
				})]).then(function (value) {
					if (that.mounted) {
						that.setState({ submitting: false });
					}
					defer.resolve(value[0]);
				}, function (error) {
					if (that.mounted) {
						that.setState({ submitting: false });
						if (error && error.fieldErrors) {
							that.setFieldErrors(error.fieldErrors);
						}
					}
					defer.reject(error);
				});
			} else {
				if (that.mounted) {
					that.setState({ submitting: false });
				}
				defer.resolve();
			}
		}, function (errors) {
			if (that.mounted) {
				that.setState({ submitting: false });
			}
			defer.reject(errors);
		});

		return defer.promise;
	},

	hasEvent: function (name) {
		if (this.props.events != null) {
			return typeof (this.props.events[name]) == 'function';
		}

		return false;
	},

	getValue: function () {
		if (!this.mounted) {
			return this.props.initialValue;
		}

		var result = {};
		for (var key in this.newValues) {
			var value = this.newValues[key];
			result[key] = value;
		}
		for (var key in this.artificialRefs) {
			var editor = this.artificialRefs[key];
			result[key] = editor.getValue();
		}
		return result;
	},

	setValue: function (values) {
		var value = utils.extend({}, this.state.presenterValues);
		for (var key in values) {
			var schema = this.props.schema[key];
			if (schema == null) {
				continue;
			}
			var editorType = utils.unwrapEditor(schema.editor);
			if (editorType == null) {
				continue;
			}
			var editor = this.artificialRefs[key];
			var val = values[key];
			if (utils.isEmptyValue(val) && editorType.defaultProps != null && editorType.defaultProps.initialValue) {
				val = editorType.defaultProps.initialValue;
			}
			if (editor) {
				editor.setValue(val);
			}

			this.newValues[key] = val;
			value[key] = val;
		}

		this.setState({ presenterValues: value });
	},

	setInitialFieldValue: function (fieldName, value) {
		if (this.newValues == null) {
			this.newValues = [];
		}
		if (value != null) {
			this.newValues[fieldName] = value;
		} else {
			delete this.newValues[fieldName];
		}
	},

	valueChanged: function (field, oldValue, newValue) {
		delete this.newValues[field];
		this.triggerEvent('onChange', arguments);
		this.forceUpdate();
	},

	setFieldErrors: function (errors) {
		var fieldErrors = this.getEmptyFieldErrors(this.props);
		var validator = { id: 'dummy_validator' };
		for (var field in this.props.schema) {
			var error = errors[field];
			if (error) {
				this.setFieldError(field, validator, error, fieldErrors);
			}
		}
		this.setState({ fieldErrors: fieldErrors });
		this.fieldErrors = fieldErrors;
	},

	// This function is quite complex
	//
	// What needs to be done is the following:
	// * Validate all simple field validators, that is
	//   validators that have no dependencies.
	//   If a single validator fails and is not asynchronous
	//   fail the validation early and exit.
	// * For each non-simple validation, schedule them to run
	//   after the fields they depend on have validated.
	//
	validate: function (values, setFocusOnFail) {
		if (values == null) {
			values = this.getValue();
		}
		if (setFocusOnFail == null) {
			setFocusOnFail = false;
		}
		var allValidations = [];
		var fieldValidators = {};
		var fieldErrors = this.getEmptyFieldErrors(this.props);
		var that = this;

		// Run all simple validations
		// store the resulting promise both as a lookup of the actual field
		// and in an array containing all validations

		// This allows for use of the async utils whenAll and awaitAll to orchestrate the entire process
		for (var field in this.props.schema) {
			(function (field) {
				var simpleFieldPromise = this.validateSimpleFieldValidations(field, values, fieldErrors);
				allValidations.push(simpleFieldPromise);
				fieldValidators[field] = simpleFieldPromise;
			}).call(this, field);
		}

		for (field in this.props.schema) {
			(function (field) {
				var nonSimpleValidators = that.validatorsWithDependencies[field];
				if (nonSimpleValidators.length > 0) {
					for (var i in nonSimpleValidators) {
						(function (i) {
							var validator = nonSimpleValidators[i];
							var deps = [fieldValidators[field]];
							var fieldValue = values[field];
							var dependencyValues = {};
							for (var key in validator.dependencies) {
								deps.push(fieldValidators[validator.dependencies[key]]);
								dependencyValues[key] = values[validator.dependencies[key]];
							}

							allValidations.push(utils.async.whenAll(deps).then(function () {
								return utils.ensurePromise(function () {
									return validator.validate(fieldValue, dependencyValues);
								}).fail(function (error) {
									that.setFieldError(field, validator, error, fieldErrors);
								});
							}));
						}).call(this, i);
					}
				}
			})(field);
		}

		var defer = Shift.defer();
		this.activeValidationPromise = defer.promise;
		var success = function () {
			if (that.activeValidationPromise == defer.promise) {
				that.setState({ fieldErrors: fieldErrors });
				that.fieldErrors = fieldErrors;
				that.activeValidationPromise = null;
			}
			defer.resolve();
		};
		var fail = function () {
			if (that.activeValidationPromise == defer.promise) {
				that.setState({ fieldErrors: fieldErrors });
				that.fieldErrors = fieldErrors;
				that.activeValidationPromise = null;
				if (setFocusOnFail) {
					var editor = that.artificialRefs[Object.keys(that.fieldErrors)[0]];
					if (editor.select) {
						editor.select();
					} else {
						editor.focus();
					}
				}
			}
			defer.reject(utils.extend({}, fieldErrors));
		};

		utils.async.awaitAll(allValidations).then(success, fail);

		return defer.promise;
	},
	validateSimpleFieldValidations: function (field, values, fieldErrors) {
		var that = this;
		var fieldValidationResults = [];
		var fieldValue = values[field];
		var err = null;
		var fieldValidator = null;

		for (var i in this.validators[field]) {
			var validator = this.validators[field][i];
			// We could simply turn everything here into a promise
			// However, if a validation fails and something else is going to
			// use a promise.
			// It would be very nice to not even have to run that validation
			try {
				var result = validator.validate(fieldValue);

				if (utils.isPromise(result)) {
					(function (validator) {
						result.then(function () {
							that.clearFieldError(field, validator, fieldErrors);
						}, function (err) {
							that.setFieldError(field, validator, err, fieldErrors);
						});
					})(validator);
				} else {
					this.clearFieldError(field, validator, fieldErrors);
				}
				fieldValidationResults.push(result);
			} catch (error) {
				var defer = Shift.defer();
				defer.reject();
				this.setFieldError(field, validator, error, fieldErrors);
				fieldValidator = defer.promise;
				break;
			}
		}
		// No point in doing whenAll when we already know we failed
		if (fieldValidator) {
			return fieldValidator;
		}
		return utils.async.whenAll(fieldValidationResults);

	},
	validateField: function (field, values, setFocusOnFail) {
		if (values == null) {
			values = this.state.values;
		}
		if (setFocusOnFail == null) {
			setFocusOnFail = false;
		}

		var fieldErrors = this.fieldErrors;

		var dependentValidators = this.validatorsDependingOnField[field];

		// First we need to get all the validators that depend on this field
		// and clear them
		for (var i in dependentValidators) {
			var validatorInfo = dependentValidators[i];
			this.clearFieldError(validatorInfo.field, validatorInfo.validator, fieldErrors);
		}

		// next we clear potential errors on this field
		delete fieldErrors[field];

		var simpleValidate = this.validateSimpleFieldValidations(field, values, fieldErrors);

		simpleValidate.then(function () {

		});


	},
	setFieldError: function (field, sourceValidator, error, value) {
		if (value == null) {
			value = this.fieldErrors;
		}
		if (error == null) {
			delete value[field][sourceValidator.id];
		} else {
			if (error.message != null) {
				error = error.message;
			}
			if (typeof (value[field]) == 'undefined') {
				value[field] = {};
			}
			value[field][sourceValidator.id] = error;
		}
	},
	focusNext: function () {
		var idx, editor;
		if (this.fieldInFocus) {
			idx = this.editors.indexOf(this.fieldInFocus);
		} else {
			idx = -1;
		}

		while (true) {
			if (idx == this.editors.length || this.editors.length == 0) {
				this.blur();
				return false;
			} else {
				editor = this.editors[idx + 1];
				if (this.artificialRefs[editor].isDisabled()) {
					idx++;
					continue;
				}
				this.focus(editor);
				return true;
			}
		}
	},
	focusPrevious: function () {
		var idx, editor;
		if (this.fieldInFocus) {
			idx = this.editors.indexOf(this.fieldInFocus);
		} else {
			idx = this.editors.length;
		}

		while (true) {
			if (idx == 0) {
				this.blur();
			} else {
				var editor = this.editors[idx - 1];
				if (this.artificialRefs[editor].isDisabled()) {
					idx--;
					continue;
				}
				this.focus(editor);
				return;
			}
		}
	},
	clearFieldError: function (field, sourceValidator, value) {
		this.setFieldError(field, sourceValidator, null, value);
	},
	fieldFocused: function (fieldName) {
		// Not using state. I do not want to re-render the entire form to get to this
		var oldFieldInFocus = this.fieldInFocus;
		if (fieldName != oldFieldInFocus) {
			this.triggerEvent('onFieldInFocusChange', [fieldName]);
		}
		this.fieldInFocus = fieldName;
	},
	fieldBlurred: function (fieldName) {
		var that = this;
		// When switching focus from one field to another
		// We do not want to first throw an event that says fieldInFocus is null
		// and then another event that states the new field is in focus
		// rather we only want the last event
		// throwing this event handler code back into the event loop seems to give us this behavior
		// at least in the tested version of chrome
		setTimeout(function () {
			if (that.state.submittedOnce) {
				//that.validateField(fieldName);
			}
			if (that.fieldInFocus == fieldName) {
				that.fieldInFocus = null;
				that.triggerEvent('onFieldInFocusChange', [null]);
			}
		}, 0);
	},

	getFieldValue: function (fieldName) {
		if (!fieldName) {
			return this.getValue();
		}
		if (this.artificialRefs[fieldName]) {
			return this.artificialRefs[fieldName].getValue();
		}
		return this.props.initialValue[fieldName];
	},

	focus: function (fieldName) {
		if (fieldName in this.props.schema) {
			var field = this.artificialRefs[fieldName];
			field.focus();
		}
	},

	select: function (fieldName) {
		if (fieldName in this.props.schema) {
			var field = this.artificialRefs[fieldName];
			if (field.select) {
				field.select();
			} else {
				field.focus();
			}
		}
	},

	blur: function () {
		if (this.fieldInFocus != null) {
			this.artificialRefs[this.fieldInFocus].blur();
		}
	}
});

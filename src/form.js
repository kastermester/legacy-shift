Shift.EditorFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});
Shift.ValidationMessageFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});

Shift.Form = React.createClass({
	propTypes: {
		events: React.PropTypes.shape({
			onSubmit: React.PropTypes.function,
			onChange: React.PropTypes.function,
			onFieldInFocusChange: React.PropTypes.function
		}),
		fields: React.PropTypes.arrayOf(React.PropTypes.string)
	},
	getDefaultProps: function(){
		return {
			idPrefix: 'form-',
			locale: 'en_US'
		};
	},
	translate: function(msg){
		if(typeof(msg) == 'string'){
			return msg;
		}

		if(typeof(msg) == 'object'){
			return msg[this.props.locale];
		}

		throw new Error("Message must either be a string or a map from locale to a string");
	},
	translateCategoryName: function(category){
		if(this.props.categoryTranslations){
			if(this.props.categoryTranslations[this.props.locale]){
				return this.props.categoryTranslations[this.props.locale][category];
			}
		}

		return category;
	},
	getInitialState: function(){
		var values = {};

		var initialValue = this.props.initialValue || {};

		for(var key in this.props.schema){
			values[key] = initialValue[key];
		}

		return {
			fieldInFocus: null,
			values: values,
			fieldErrors: this.getEmptyFieldErrors(),
			submittedOnce: false
		};
	},

	getEmptyFieldErrors: function(){
		var result = {};

		for(var key in this.props.schema){
			result[key] = {};
		}

		return result;
	},

	componentWillMount: function(){
		this.validators = {};
		this.validatorsWithDependencies = {};
		this.validatorsDependingOnField = {};
		// We save this here as non-state.
		// React updates the state in some weird asynchronous way
		// we need a synchronous way of reading the state
		this.fieldErrors = this.getEmptyFieldErrors();

		for(var field in this.props.schema){
			this.validators[field] = [];
			this.validatorsDependingOnField[field] = [];
			this.validatorsWithDependencies[field] = [];
		}

		for(var field in this.props.schema){
			var schema = this.props.schema[field];
			if(schema.validators instanceof Array){
				var validators = this.normalizeValidators(schema.validators);
				for(var i in validators){
					var validator = validators[i];
					if(Object.keys(validator.dependencies).length == 0){
						this.validators[field].push(validator);
					} else {
						this.validatorsWithDependencies[field].push(validator);
						for(var key in validator.dependencies){
							var otherField = validator.dependencies[key];
							this.validatorsDependingOnField[otherField].push({field: field, validator: validator});
						}
					}
				}
			}
		}
	},
	componentWillUnmount: function(){
		this.validators = null;
		this.validatorsDependingOnField = null;
		this.fieldErrors = null;
	},

	defaultTemplate: function(canSubmit, submit, form){
		return [
			Shift.FieldsFor({}, Shift.ValidationClassStatusFor({
				errorClassName: 'validation-error'
			}, [
				Shift.LabelFor(),
				Shift.EditorFor(),
				Shift.ValidationMessageFor()
			])),
			Shift.CategoryFor({}, React.DOM.fieldset({}, [
				Shift.CategoryNameFor({tagName: 'legend'}),
				Shift.FieldsFor({}, Shift.ValidationClassStatusFor({
					errorClassName: 'validation-error'
				}, [
					Shift.LabelFor(),
					Shift.EditorFor(),
					Shift.ValidationMessageFor()
				]))
			])
			), React.DOM.input({type: 'submit', 'disabled': !canSubmit, value: 'Go!'})];
	},

	getTemplate: function(){
		var canSubmit = !this.state.submitting //&& Object.keys(this.state.fieldErrors).length == 0;
		var template = this.props.template || this.defaultTemplate;
		return React.DOM.form({onSubmit: this.formSubmitted}, template.call(undefined, canSubmit, this.submit, this));
	},
	normalizeValidators: function(validators){
		return validators.map(function(e){
			if(['string','function'].indexOf(typeof(e)) >= 0){
				return new Shift.Validator(e, {}, {});
			}

			if(e instanceof Shift.Validator){
				return e;
			}

			var type = e.type;
			var params = e.params;
			var dependencies = e.dependencies;
			return new Shift.Validator(type, params, dependencies);
		});
	},
	render: function(){
		var that = this;
		var template = this.getTemplate();

		var templateMap = this.getTemplateMap();

		return utils.templateHelper(template, this.props.fields || Object.keys(this.props.schema), this.props.categories || {}, function(category){
			return that.translateCategoryName(category);
		}, templateMap);
	},

	isFieldValid: function(fieldName){
		return typeof(this.state.fieldErrors[fieldName]) == 'undefined' || Object.keys(this.state.fieldErrors[fieldName]).length == 0;
	},

	getFieldErrorMessage: function(fieldName){
		var err = this.state.fieldErrors[fieldName];

		var keys = Object.keys(err);

		if(keys.length == 0){
			return '';
		}

		return this.translate(err[keys[0]]);
	},
	generateEditorId: function(fieldName){
		return this.props.idPrefix + fieldName;
	},
	getTemplateMap: function(){
		var that = this;
		var result = [];

		result.push(Shift.EditorFor);
		result.push(function(fieldName, reactNode){
			var field = that.props.schema[fieldName];
			return utils.unwrapEditor(field.editor)(utils.extend({}, field.editorProps, {
				ref: 'field.editor.'+fieldName,
				key: 'field.editor.'+fieldName,
				value: that.state.values[fieldName],
				className: utils.mergeClassNames(
					reactNode.props.className,
					reactNode.props.errorClassName,
					that.isFieldValid(fieldName)
				),
				locale: that.props.locale,
				editorId: that.generateEditorId(fieldName),
				events: {
					onChange: function(oldValue, newValue){
						that.valueChanged(fieldName, oldValue, newValue);
					},
					onFocus: function(){
						that.fieldFocused(fieldName);
					},
					onBlur: function(){
						that.fieldBlurred(fieldName);
					}
				}
			}));
		});

		result.push(Shift.LabelFor);
		result.push(function(fieldName, reactNode){
			var field = that.props.schema[fieldName];
			var tagName = reactNode.props.tagName;
			var className = reactNode.props.className;
			var errorClassName = reactNode.props.errorClassName;
			var label = field.label;

			if (field.editorLabel){
				label = field.editorLabel;
			}
			return Shift.Label({
				tagName: tagName,
				text: that.translate(label),
				editorId: that.generateEditorId(fieldName),
				className: utils.mergeClassNames(
					className,
					errorClassName,
					that.isFieldValid(fieldName)
				)
			});
		});

		result.push(Shift.ValidationMessageFor);
		result.push(function(fieldName, reactNode){
			var className = reactNode.props.className;
			var tagName = reactNode.props.tagName;
			var errorClassName = reactNode.props.errorClassName;
			var isValid = that.isFieldValid(fieldName);
			var msg = that.getFieldErrorMessage(fieldName);

			return Shift.Label({
				tagName: tagName,
				text: msg,
				className: utils.mergeClassNames(
					className,
					errorClassName,
					that.isFieldValid(fieldName)
				)
			});
		});

		result.push(Shift.ValidationClassStatusFor);
		result.push(function(fieldName, reactNode){
			var className = reactNode.props.className;
			var tagName = reactNode.props.tagName;
			var errorClassName = reactNode.props.errorClassName;
			var isValid = that.isFieldValid(fieldName);

			return Shift.ValidationClassStatus({
				tagName: tagName,
				className: utils.mergeClassNames(
					className,
					errorClassName,
					that.isFieldValid(fieldName)
				)
			}, reactNode.props.children.map(function(child){
				return utils.templateHelper.replaceExplicitFields([], [], function(category){
					return that.translateCategoryName(category);
				}, child, result, fieldName);
			}));
		});

		return result;
	},

	formSubmitted: function(e){
		e.preventDefault();
		e.stopPropagation();

		if(!this.state.submitting){
			this.submit(null, true);
		}
	},

	submit: function(){
		var defer = Shift.defer();
		var values = this.state.values;
		var that = this;
		this.setState({submitting: true, submittedOnce: true});
		this.validate(values).then(function(){
			if(that.hasEvent('onSubmit')){
				utils.async.whenAll([utils.ensurePromise(function(){
					return that.triggerEvent('onSubmit', [values]);
				})]).then(function(value){
					that.setState({submitting: false});
					defer.resolve(value[0]);
				}, function(error){
					that.setState({submitting: false});
					defer.reject(error);
				});
			} else {
				that.setState({submitting: false});
				defer.resolve();
			}
		}, function(errors){
			that.setState({submitting: false});
			defer.reject(errors);
		});

		return defer.promise;
	},
	hasEvent: function(name){
		if(this.props.events != null){
			return typeof(this.props.events[name]) == 'function';
		}

		return false;
	},
	triggerEvent: function(name, args){
		if(this.props.events != null){
			if(typeof(this.props.events[name]) == 'function'){
				return this.props.events[name].apply(this.props.eventHandlerContext || undefined, args);
			}
		}
		return null;
	},

	getValue: function(){
		return utils.extend({}, this.state.values);
	},

	setValue: function(values){
		var toSet = utils.extend(this.state.values, values);
		this.setState({
			values: toSet
		});

		return toSet;
	},

	valueChanged: function(field, oldValue, newValue){
		var valueMap = {};
		valueMap[field] = newValue;
		var values = this.setValue(valueMap);
		this.triggerEvent('onChange', arguments);
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
	validate: function(values, setFocusOnFail){
		if(values == null){
			values = this.state.values;
		}
		if(setFocusOnFail == null){
			setFocusOnFail = false;
		}
		var allValidations = [];
		var fieldValidators = {};
		var fieldErrors = this.getEmptyFieldErrors();
		var that = this;

		// Run all simple validations
		// store the resulting promise both as a lookup of the actual field
		// and in an array containing all validations

		// This allows for use of the async utils whenAll and awaitAll to orchestrate the entire process
		for(var field in this.props.schema){
			(function(field){
				var simpleFieldPromise = this.validateSimpleFieldValidations(field, values, fieldErrors);
				allValidations.push(simpleFieldPromise);
				fieldValidators[field] = simpleFieldPromise;
			}).call(this, field);
		}

		for(field in this.props.schema){
			(function(field){
				var nonSimpleValidators = that.validatorsWithDependencies[field];
				if(nonSimpleValidators.length > 0){
					for(var i in nonSimpleValidators){
						(function(i){
							var validator = nonSimpleValidators[i];
							var deps = [fieldValidators[field]];
							var fieldValue = values[field];
							var dependencyValues = {};
							for(var key in validator.dependencies){
								deps.push(fieldValidators[validator.dependencies[key]]);
								dependencyValues[key] = values[validator.dependencies[key]];
							}

							allValidations.push(utils.async.whenAll(deps).then(function(){
								return utils.ensurePromise(function(){
									return validator.validate(fieldValue, dependencyValues);
								}).fail(function(error){
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
		var success = function(){
			if(that.activeValidationPromise == defer.promise){
				that.setState({fieldErrors: fieldErrors});
				this.fieldErrors = fieldErrors;
				that.activeValidationPromise = null;
			}
			defer.resolve();
		};
		var fail = function(){
			if(that.activeValidationPromise == defer.promise){
				that.setState({fieldErrors: fieldErrors});
				this.fieldErrors = fieldErrors;
				that.activeValidationPromise = null;
				if(setFocusOnFail){
					that.refs['field.editor.'+ Object.keys(this.fieldErrors)[0]].select();
				}
			}
			defer.reject(utils.extend({}, fieldErrors));
		};

		utils.async.awaitAll(allValidations).then(success, fail);

		return defer.promise;
	},
	validateSimpleFieldValidations: function(field, values, fieldErrors){
		var that = this;
		var fieldValidationResults = [];
		var fieldValue = values[field];
		var err = null;
		var fieldValidator = null;

		for(var i in this.validators[field]){
			var validator = this.validators[field][i];
			// We could simply turn everything here into a promise
			// However, if a validation fails and something else is going to
			// use a promise.
			// It would be very nice to not even have to run that validation
			try {
				var result = validator.validate(fieldValue);

				if (utils.isPromise(result)){
					(function(validator){
						result.then(function(){
							that.clearFieldError(field, validator, fieldErrors);
						}, function(err){
							that.setFieldError(field, validator, err, fieldErrors);
						});
					})(validator);
				} else {
					this.clearFieldError(field, validator, fieldErrors);
				}
				fieldValidationResults.push(result);
			} catch(error){
				var defer = Shift.defer();
				defer.reject();
				this.setFieldError(field, validator, error, fieldErrors);
				fieldValidator = defer.promise;
				break;
			}
		}
		// No point in doing whenAll when we already know we failed
		if(fieldValidator){
			return fieldValidator;
		}
		return utils.async.whenAll(fieldValidationResults);

	},
	validateField: function(field, values, setFocusOnFail){
		if(values == null){
			values = this.state.values;
		}
		if(setFocusOnFail == null){
			setFocusOnFail = false;
		}

		var fieldErrors = this.fieldErrors;


		var dependentValidators = this.validatorsDependingOnField[field];

		// First we need to get all the validators that depend on this field
		// and clear them
		for(var i in dependentValidators){
			var validatorInfo = dependentValidators[i];
			this.clearFieldError(validatorInfo.field, validatorInfo.validator, fieldErrors);
		}

		// next we clear potential errors on this field
		delete fieldErrors[field];

		var simpleValidate = this.validateSimpleFieldValidations(field, values, fieldErrors);

		simpleValidate.then(function(){

		});


	},
	setFieldError: function(field, sourceValidator, error, value){
		if(value == null){
			value = this.fieldErrors;
		}
		if(error == null){
			delete value[field][sourceValidator.id];
		} else {
			if(error.message != null){
				error = error.message;
			}
			if(typeof(value[field]) == 'undefined'){
				value[field] = {};
			}
			value[field][sourceValidator.id] = error;
		}
	},
	clearFieldError: function(field, sourceValidator, value){
		this.setFieldError(field, sourceValidator, null, value);
	},
	fieldFocused: function(fieldName){
		this.setState({
			fieldInFocus: fieldName
		});

		this.triggerEvent('onFieldInFocusChange', [fieldName]);
	},
	fieldBlurred: function(fieldName){
		var that = this;
		// When switching focus from one field to another
		// We do not want to first throw an event that says fieldInFocus is null
		// and then another event that states the new field is in focus
		// rather we only want the last event
		// throwing this event handler code back into the event loop seems to give us this behavior
		// at least in the tested version of chrome
		setTimeout(function(){
			if(that.state.submittedOnce){
				//that.validateField(fieldName);
			}
			if(that.state.fieldInFocus == fieldName){
				that.setState({
					fieldInFocus: null
				});
				that.triggerEvent('onFieldInFocusChange', [null]);
			}
		}, 0);
	},

	focus: function(fieldName){
		if(fieldName in this.props.schema){
			var field = this.refs['field.editor.'+fieldName];
			field.focus();
		}
	},

	blur: function(){
		if(this.state.fieldInFocus != null){
			this.refs['field.editor.'+this.state.fieldInFocus].blur();
		}
	}
});

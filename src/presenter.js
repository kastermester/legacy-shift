Shift.PresenterFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});

Shift.Presenter = React.createClass({
	defaultTemplate: function(canSubmit, submit, form){
		return React.DOM.div({}, [
			Shift.FieldsFor({}, React.DOM.div({}, [
				Shift.TitleFor(),
				React.DOM.span(null, ': '),
				Shift.PresenterFor()
			])),
			Shift.CategoryFor({}, React.DOM.fieldset({}, [
				Shift.CategoryNameFor({tagName: 'legend'}),
				Shift.FieldsFor({}, React.DOM.div({}, [
					Shift.TitleFor(),
					React.DOM.span(null, ': '),
					Shift.PresenterFor()
				]))
			]))
		]);
	},
	getPropTypes: function(){
		return {
			fields: React.PropTypes.arrayOf(React.PropTypes.string)
		};
	},
	getDefaultProps: function(){
		return {
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
	getTemplate: function(){
		var template = this.props.template || this.defaultTemplate;
		return template(this);
	},
	render: function(){
		var that = this;
		var template = this.getTemplate();

		var templateMap = this.getTemplateMap();

		return utils.templateHelper(template, this.props.fields || Object.keys(this.props.value), this.props.categories || {}, function(category){
			return that.translateCategoryName(category);
		}, templateMap);
	},
	getTemplateMap: function(){
		var that = this;
		var result = [];

		result.push(Shift.PresenterFor);
		result.push(function(fieldName, reactNode){
			var field = that.props.schema[fieldName];
			return utils.unwrapPresenter(field.presenter)(utils.extend({}, field.presenterProps, {
				key: 'field.presenter.'+fieldName,
				value: that.props.value[fieldName],
				className: reactNode.props.className,
				locale: that.props.locale
			}));
		});

		result.push(Shift.TitleFor);
		result.push(function(fieldName, reactNode){
			var field = that.props.schema[fieldName];
			var tagName = reactNode.props.tagName;
			var className = reactNode.props.className;
			return Shift.Title({
				tagName: tagName,
				text: that.translate(field.label),
				className: className
			});
		});

		return result;
	},
});

Shift.PresenterFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});
Shift.IfNonEmptyValueFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});
Shift.IfEmptyValueFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});

Shift.Presenter = React.createClass({
	mixins: [Shift.Mixins.translate],
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
			locale: 'en_US',
			context: null
		};
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
	getFields: function(){
		var fields = this.props.fields || Object.keys(this.props.schema);

		var result = [];

		for(var i in fields){
			var field = fields[i];

			if(this.props.schema[field].presenter){
				result.push(field);
			}
		}

		return result;
	},
	getCategories: function(){
		var categories = this.props.categories || {};

		var result = {};

		for(var categoryName in categories){
			var fieldNames = categories[categoryName];

			var fields = [];

			for(var i in fields){
				var field = fields[i];

				if(this.props.schema[field].presenter){
					fields.push(field);
				}
			}

			if(fields.length > 0){
				result[categoryName] = fields;
			}
		}

		return result;
	},
	render: function(){
		var that = this;
		var template = this.getTemplate();

		var templateMap = this.getTemplateMap();

		var result = utils.templateHelper(template, this.getFields(), this.getCategories(), function(category){
			return that.translateCategoryName(category);
		}, templateMap);

		return result;
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
				locale: that.props.locale,
				context: that.props.context
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

		result.push(Shift.IfNonEmptyValueFor);
		result.push(function(fieldName, reactNode){
			var fieldValue = that.props.value[fieldName];
			if(utils.isEmptyValue(fieldValue)){
				return null;
			}

			return reactNode.props.children;
		});

		result.push(Shift.IfEmptyValueFor);
		result.push(function(fieldName, reactNode){
			var fieldValue = that.props.value[fieldName];
			if(utils.isEmptyValue(fieldValue)){
				return reactNode.props.children;
			}

			return null;
		});

		return result;
	},
});

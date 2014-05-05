Shift.PresenterFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});

Shift.Presenter = React.createClass({
	defaultTemplate: function(canSubmit, submit, form){
		return React.DOM.div({}, [Shift.CategoryFor({}, React.DOM.fieldset({}, [
			Shift.CategoryNameFor({tagName: 'legend'}),
			Shift.FieldsFor({}, React.DOM.div({}, [
				Shift.TitleFor(),
				React.DOM.span(null, ': '),
				Shift.PresenterFor(),
			]))
		]))]);
	},
	getTemplate: function(){
		var template = this.props.template || this.defaultTemplate;
		return template(this);
	},
	render: function(){
		var that = this;
		var template = this.getTemplate();

		var templateMap = this.getTemplateMap();

		var fieldNames = [];

		for(var field in this.props.fields){
			fieldNames.push(field);
		}

		var categoryForField = function(fieldName){
			var field = that.props.fields[fieldName];

			return field.category;
		};

		return utils.templateHelper(template, fieldNames, categoryForField, templateMap);
	},
	getTemplateMap: function(){
		var that = this;
		var result = [];

		result.push(Shift.PresenterFor);
		result.push(function(fieldName, reactNode){
			var field = that.props.fields[fieldName];
			return field.presenter(utils.extend({}, field.presenterProps, {
				key: 'field.presenter.'+fieldName,
				value: that.props.values[fieldName],
				className: reactNode.props.className
			}));
		});

		result.push(Shift.TitleFor);
		result.push(function(fieldName, reactNode){
			var field = that.props.fields[fieldName];
			var tagName = reactNode.props.tagName;
			var className = reactNode.props.className;
			return Shift.Title({
				tagName: tagName,
				text: field.label,
				className: className
			});
		});

		return result;
	},
});

utils.templateHelper = function(template, fieldNames, categories, convertCategoryName, templateMap, fieldValues, context, schema, form){
	// First replace all fields that are stated explicitly in the template
	var explicitFields = {};
	var explicitCategories = {};
	var hasImplicitCategories = false;
	var replacedFields = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, template, templateMap, null, function(){
		hasImplicitCategories = true;
	}, fieldValues, context, schema, form);

	// Find every field that was not explicitly stated and mark them as implicit
	var implicitFields = [];
	var implicitCategories = [];


	if(!hasImplicitCategories){
		for(var i in fieldNames){
			var fieldName = fieldNames[i];

			if(!explicitFields[fieldName]){
				implicitFields.push(fieldName);
			}
		}
	} else {
		// We can have both fields without a category, and fields with a category, loop through all the explicit categories and add an exlusion map
		var fieldsInCategories = {};
		for(var category in categories){

			if(!explicitCategories[category]){
				implicitCategories.push(category);
			}

			var fields = categories[category];
			fields.forEach(function(field){
				if(!explicitFields[field]){
					fieldsInCategories[field] = true;
				}
			});
		}

		for(var i in fieldNames){
			var field = fieldNames[i];

			if(!fieldsInCategories[field] && !explicitFields[field]){
				implicitFields.push(field);
			}
		}
	}

	// Now replace the implicit fields
	return utils.templateHelper.replaceImplicitFields(replacedFields, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, null, fieldValues, context, schema, form);
};

utils.templateHelper.cloneNodeWithNewProperties = function(node, properties, children, explicitKey){
	// Case to handle instances of React.__internals.TextComponent could test with React.__internals.TextComponent.type === node.type
	// but that seems even more hacky than what this is already
	if(typeof(properties) === 'string'){
		return node;
	}

	var extraProps = {
		children: children
	};

	if (node.key){
		extraProps.key = node.key;
	}

	if(explicitKey){
		extraProps.key = explicitKey;
	}

	return React.addons.cloneWithProps(node, utils.extend({}, properties, extraProps));
};

utils.templateHelper.replaceExplicitFields = function(explicitFields, explicitCategories, convertCategoryName, reactNode, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form){
	var fieldName;
	if(Shift.FieldsFor.type == reactNode.type){
		return reactNode;
	}

	if(Shift.CategoryFor.type == reactNode.type){
		var categoryName = reactNode.props.category;
		if(typeof(categoryName) == 'string'){
			explicitCategories[categoryName] = true;
		} else {
			callOnImplicitCategories.call(undefined);
		}
	}

	if(reactNode.type == Shift.CategoryNameFor.type){
		return reactNode;
	}

	if(reactNode.type == Shift.PassFieldProperties.type){
		var fieldName = explicitFieldName;
		if(reactNode.props.field){
			fieldName = reactNode.props.field;
		}
		if(!fieldName){
			throw new Error("Cannot use Shift.PassFieldProperties without being inside a FieldsFor tag or without the field property being explicitly set");
		}
		var extraProps = {};

		if(reactNode.props.fieldName){
			var fieldNameProperty = reactNode.props.fieldNameProperty ? reactNode.props.fieldNameProperty : 'fieldName';
			extraProps[fieldNameProperty] = fieldName;
		}
		if(reactNode.props.fieldValue){
			var fieldValueProperty = reactNode.props.fieldValueProperty ? reactNode.props.fieldValueProperty : 'fieldValue';
			extraProps[fieldValueProperty] = fieldValues(fieldName);
		}
		if(reactNode.props.formInstance){
			var formInstanceProperty = reactNode.props.formInstanceProperty ? reactNode.props.formInstanceProperty : 'formInstance';
			extraProps[formInstanceProperty] = form;
		}
		if(reactNode.props.context){
			var contextProperty = reactNode.props.contextProperty ? reactNode.props.contextProperty : 'context';
			extraProps[contextProperty] = context;
		}
		if(reactNode.props.schema){
			var schemaProperty = reactNode.props.schemaProperty ? reactNode.props.schemaProperty : 'schema';
			extraProps[schemaProperty] = schema[fieldName];
		}
		if(reactNode.props.children == null || Array.isArray(reactNode.props.children)){
			throw new Error("PassFieldProperties must only contain a single child");
		}
		var key = reactNode.props.children.key + '-' + fieldName;
		var child = utils.templateHelper.cloneNodeWithNewProperties(reactNode.props.children, extraProps, reactNode.props.children.props.children, key);
		return utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, child, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form);
	}

	if([Shift.PassFormProperties.type, Shift.PassPresenterProperties].indexOf(reactNode.type) >= 0){
		var extraProps = {};

		if(reactNode.props.context){
			var contextProperty = reactNode.props.contextProperty ? reactNode.props.contextProperty : 'context';
			extraProps[contextProperty] = context;
		}
		if(reactNode.props.value){
			var valueProperty = reactNode.props.valueProperty ? reactNode.props.valueProperty : 'value';
			extraProps[valueProperty] = fieldValues();
		}
		if(reactNode.props.schema){
			var schemaProperty = reactNode.props.schemaProperty ? reactNode.props.schemaProperty : 'schema';
			extraProps[schemaProperty] = schema;
		}
		if(reactNode.props.formInstance){
			var formInstanceProperty = reactNode.props.formInstanceProperty ? reactNode.props.formInstanceProperty : 'formInstance';
			extraProps[formInstanceProperty] = form;
		}
		if(reactNode.props.children == null || Array.isArray(reactNode.props.children)){
			throw new Error("PassFormProperties/PassPresenterProperties must only contain a single child");
		}
		var key = reactNode.props.children.key;
		var child = utils.templateHelper.cloneNodeWithNewProperties(reactNode.props.children, extraProps, reactNode.props.children.props.children, key);
		return utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, child, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form);
	}

	for(var i = 0, n = templateMap.length; i < n-1; i += 2){
		var reactType = templateMap[i];
		var handler = templateMap[i+1];
		if(reactNode.type == reactType.type){
			if (explicitFieldName != null){
				fieldName = explicitFieldName;
			} else {
				fieldName = reactNode.props.field;
			}
			if(fieldName !== undefined){
				explicitFields[fieldName] = true;
			}
			var result = handler(fieldName, reactNode);

			if(result === null){
				return null;
			}

			if(Array.isArray(result)){
				var replaced = [];

				result.forEach(function(node){
					var n = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, node, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form)
					if(n !== null){
						replaced.push(n);
					}
				});

				return replaced;
			}

			return utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, result, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form);
		}
	}

	var children;
	if (['number','string', 'boolean'].indexOf(typeof(reactNode)) >= 0){
		// For strings and all that funky stuff
		return reactNode;
	} else if(Array.isArray(reactNode.props.children)){
		var children = [];
		React.Children.forEach(reactNode.props.children, function(child){
			var renderedChild = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, child, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form)
			if(renderedChild !== null){
				children.push(renderedChild);
			}
		});
	} else if(reactNode.props.children != null) {
		children = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, reactNode.props.children, templateMap, explicitFieldName, callOnImplicitCategories, fieldValues, context, schema, form);
	}

	return utils.templateHelper.cloneNodeWithNewProperties(reactNode, {}, children);
};

utils.templateHelper.replaceImplicitFields = function(reactNode, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, categoryName, fieldValues, context, schema, form){
	if(reactNode.type == Shift.FieldsFor.type){
		var fields = implicitFields;
		if(typeof(categoryName) == 'string'){
			fields = categories[categoryName];
		}
		var template = fields.map(function(field){
			var result = [];

			React.Children.forEach(reactNode.props.children, function(child){
				var renderedChild = utils.templateHelper.replaceExplicitFields({}, {}, convertCategoryName, child, templateMap, field, function(){}, fieldValues, context, schema, form);
				if(renderedChild !== null){
					if(Array.isArray(renderedChild)){
						var children = [];
						React.Children.forEach(renderedChild, function(child){
							children.push(utils.templateHelper.cloneNodeWithNewProperties(child, {key: field + child.props.key}, child.props.children));
						});
						renderedChild = children;
					} else {
						renderedChild = utils.templateHelper.cloneNodeWithNewProperties(renderedChild, {key: field + renderedChild.props.key}, renderedChild.props.children);
					}
					result.push(renderedChild);
				}
			});

			return result;
		});
		var merged = [];
		return merged.concat.apply(merged, template);
	} else if(reactNode.type == Shift.CategoryFor.type){
		var category = reactNode.props.category;

		if(typeof(category) == 'string'){
			var result = [];
			if(categories[category]){
				React.Children.forEach(reactNode.props.children, function(child){
					var renderedChild = utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, category, fieldValues, context, schema, form);
					if(renderedChild !== null){
						if(Array.isArray(renderedChild)){
							var children = [];
							React.Children.forEach(renderedChild, function(child){
								children.push(utils.templateHelper.cloneNodeWithNewProperties(child, {key: category + child.props.key}, child.props.children));
							});
							renderedChild = children;
						} else {
							renderedChild = utils.templateHelper.cloneNodeWithNewProperties(renderedChild, {key: category + renderedChild.props.key}, renderedChild.props.children);
						}
						result.push(renderedChild);
					}
				});
			}

			return result;
		}

		var template = implicitCategories.map(function(category){
			var result = [];

			React.Children.forEach(reactNode.props.children, function(child){
				var renderedChild = utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, category, fieldValues, context, schema, form);
				if(renderedChild !== null){
					if(Array.isArray(renderedChild)){
						var children = [];
						React.Children.forEach(renderedChild, function(child){
							children.push(utils.templateHelper.cloneNodeWithNewProperties(child, {key: category + child.props.key}, child.props.children));
						});
						renderedChild = children;
					} else {
						renderedChild = utils.templateHelper.cloneNodeWithNewProperties(renderedChild, {key: category + renderedChild.props.key}, renderedChild.props.children);
					}
					result.push(renderedChild);
				}
			});

			return result;
		});
		var merged = [];
		return merged.concat.apply(merged, template);
	} else if (reactNode.type == Shift.CategoryNameFor.type){
		if(typeof(categoryName) != 'string'){
			throw new Error("CategoryNameFor must be used inside a CategoryFor node, and outside a FieldsFor node");
		}
		return React.DOM[reactNode.props.tagName || 'span'](null, convertCategoryName(categoryName));
	} else {
		var children;
		if (['number','string', 'boolean'].indexOf(typeof(reactNode)) >= 0){
			// For strings and all that funky stuff
			return reactNode;
		} else if(Array.isArray(reactNode.props.children)){
			var children = [];
			React.Children.forEach(reactNode.props.children, function(child){
				children.push(utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, categoryName, fieldValues, context, schema, form));
			});
		} else if(reactNode.props.children != null) {
			children = utils.templateHelper.replaceImplicitFields(reactNode.props.children, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, categoryName, fieldValues, context, schema, form);
		}

		return utils.templateHelper.cloneNodeWithNewProperties(reactNode, {}, children);
	}
};

utils.templateHelper.forEachEditor = function(node, callback){
	if (node.type == Shift.Editor.type){
		return callback(node);
	}

	if (React.isValidElement(node)){
		React.Children.forEach(node.props.children, function(child){
			utils.templateHelper.forEachEditor(child, callback);
		});
	}
}

Shift.FieldsFor = ShiftFieldsFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});
Shift.CategoryFor = ShiftCategoryFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});
Shift.CategoryNameFor = ShiftCategoryNameFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});

Shift.PassFieldProperties = ShiftPassFieldProperties = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});

Shift.PassFormProperties = ShiftPassFormProperties = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});

Shift.PassPresenterProperties = ShiftPassPresenterProperties = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});

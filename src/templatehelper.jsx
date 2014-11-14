utils.templateHelper = function(template, fieldNames, categories, convertCategoryName, templateMap){
	// First replace all fields that are stated explicitly in the template
	var explicitFields = {};
	var explicitCategories = {};
	var hasImplicitCategories = false;
	var replacedFields = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, template, templateMap, null, function(){
		hasImplicitCategories = true;
	});

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
	return utils.templateHelper.replaceImplicitFields(replacedFields, implicitFields, implicitCategories, categories, convertCategoryName, templateMap);
};

utils.templateHelper.cloneNodeWithNewProperties = function(node, properties, children){
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

	return React.addons.cloneWithProps(node, utils.extend({}, properties, extraProps));
};

utils.templateHelper.replaceExplicitFields = function(explicitFields, explicitCategories, convertCategoryName, reactNode, templateMap, explicitFieldName, callOnImplicitCategories){
	var fieldName;
	if(Shift.FieldsFor.type == reactNode.type){
		return reactNode;
	}

	if(Shift.CategoryFor.type == reactNode.type){
		var categoryName = reactNode.props.category;
		if(categoryName){
			explicitCategories[categoryName] = true;
		} else {
			callOnImplicitCategories.call(undefined);
		}
	}

	if(reactNode.type == Shift.CategoryNameFor.type){
		return reactNode;
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
					var n = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, node, templateMap, explicitFieldName, callOnImplicitCategories)
					if(n !== null){
						replaced.push(n);
					}
				});

				return replaced;
			}

			return utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, result, templateMap, explicitFieldName, callOnImplicitCategories);
		}
	}

	var children;
	if (['number','string', 'boolean'].indexOf(typeof(reactNode)) >= 0){
		// For strings and all that funky stuff
		return reactNode;
	} else if(Array.isArray(reactNode.props.children)){
		var children = [];
		React.Children.forEach(reactNode.props.children, function(child){
			var renderedChild = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, child, templateMap, explicitFieldName, callOnImplicitCategories)
			if(renderedChild !== null){
				children.push(renderedChild);
			}
		});
	} else if(reactNode.props.children != null) {
		children = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, convertCategoryName, reactNode.props.children, templateMap, explicitFieldName, callOnImplicitCategories);
	}

	return utils.templateHelper.cloneNodeWithNewProperties(reactNode, reactNode.props, children);
};

utils.templateHelper.replaceImplicitFields = function(reactNode, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, categoryName){
	if(reactNode.type == Shift.FieldsFor.type){
		var fields = implicitFields;
		if(categoryName){
			fields = categories[categoryName];
		}
		var template = fields.map(function(field){
			var result = [];

			React.Children.forEach(reactNode.props.children, function(child){
				var renderedChild = utils.templateHelper.replaceExplicitFields({}, {}, convertCategoryName, child, templateMap, field, function(){});
				if(renderedChild !== null){
					renderedChild = utils.templateHelper.cloneNodeWithNewProperties(renderedChild, utils.extend({}, renderedChild.props, {key: field + renderedChild.props.key}), renderedChild.props.children);
					result.push(renderedChild);
				}
			});

			return result;
		});
		var merged = [];
		return merged.concat.apply(merged, template);
	} else if(reactNode.type == Shift.CategoryFor.type){
		var category = reactNode.props.category;

		if(category){
			var result = [];
			React.Children.forEach(reactNode.props.children, function(child){
				var renderedChild = utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, category);
				if(renderedChild !== null){
					renderedChild = utils.templateHelper.cloneNodeWithNewProperties(renderedChild, utils.extend({}, renderedChild.props, {key: category + renderedChild.props.key}), renderedChild.props.children);
					result.push(renderedChild);
				}
			});

			return result;
		}

		var template = implicitCategories.map(function(category){
			var result = [];

			React.Children.forEach(reactNode.props.children, function(child){
				var renderedChild = utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, category);
				if(renderedChild !== null){
					renderedChild = utils.templateHelper.cloneNodeWithNewProperties(renderedChild, utils.extend({}, renderedChild.props, {key: category + renderedChild.props.key}), renderedChild.props.children);
					result.push(renderedChild);
				}
			});

			return result;
		});
		var merged = [];
		return merged.concat.apply(merged, template);
	} else if (reactNode.type == Shift.CategoryNameFor.type){
		if(!categoryName){
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
				children.push(utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, categoryName));
			});
		} else if(reactNode.props.children != null) {
			children = utils.templateHelper.replaceImplicitFields(reactNode.props.children, implicitFields, implicitCategories, categories, convertCategoryName, templateMap, categoryName);
		}

		return utils.templateHelper.cloneNodeWithNewProperties(reactNode, reactNode.props, children);
	}
};

Shift.FieldsFor = ShiftFieldsFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});
Shift.CategoryFor = ShiftCategoryFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});
Shift.CategoryNameFor = ShiftCategoryNameFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});

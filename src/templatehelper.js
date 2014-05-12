utils.templateHelper = function(template, fieldNames, categories, templateMap){
	// First replace all fields that are stated explicitly in the template
	var explicitFields = {};
	var explicitCategories = {};
	var hasImplicitCategories = false;
	var replacedFields = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, template, templateMap, null, function(){
		hasImplicitCategories = true;
	});

	// Find every field that was not explicitly stated and mark them as implicit
	var implicitFields = [];
	var implicitCategories = [];


	if(!hasImplicitCategories){
		for(var i in fieldNames){
			var fieldName = fieldNames[i];

			if(!explicitFields[fieldNames]){
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
				fieldsInCategories[field] = true;
			});
		}

		for(var i in fieldNames){
			var field = fieldNames[i];

			if(!fieldsInCategories[field]){
				implicitFields.push(field);
			}
		}
	}

	// Now replace the implicit fields
	return utils.templateHelper.replaceImplicitFields(replacedFields, implicitFields, implicitCategories, categories, templateMap);
};

utils.templateHelper.cloneNodeWithNewProperties = function(node, properties, children){
	// This seems weird, but basicly we mimic what the normal constructor
	// react uses does to create a copy of the node
	var clone = new node.constructor();

	var newProperties = utils.extend({}, properties);
	delete newProperties.children;

	clone.construct.call(clone, newProperties, children);

	return clone;
};

utils.templateHelper.replaceExplicitFields = function(explicitFields, explicitCategories, reactNode, templateMap, explicitFieldName, callOnImplicitCategories){
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
			explicitFields[fieldName] = true;
			return handler(fieldName, reactNode);
		}
	}

	var children;
	if (['number','string', 'boolean'].indexOf(typeof(reactNode)) >= 0){
		// For strings and all that funky stuff
		return reactNode;
	} else if(Array.isArray(reactNode.props.children)){
		var children = [];
		React.Children.forEach(reactNode.props.children, function(child){
			children.push(utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, child, templateMap, explicitFieldName, callOnImplicitCategories));
		});
	} else if(reactNode.props.children != null) {
		children = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, reactNode.props.children, templateMap, explicitFieldName, callOnImplicitCategories);
	}

	return utils.templateHelper.cloneNodeWithNewProperties(reactNode, reactNode.props, children);
};

utils.templateHelper.replaceImplicitFields = function(reactNode, implicitFields, implicitCategories, categories, templateMap, categoryName){
	if(reactNode.type == Shift.FieldsFor.type){
		var fields = implicitFields;
		if(categoryName){
			fields = categories[categoryName];
		}
		var template = fields.map(function(field){
			var result = [];

			React.Children.forEach(reactNode.props.children, function(child){
				result.push(utils.templateHelper.replaceExplicitFields({}, {}, child, templateMap, field, function(){}));
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
				utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, templateMap, category);
			});

			return result;
		}

		var template = implicitCategories.map(function(category){
			var result = [];

			React.Children.forEach(reactNode.props.children, function(child){
				result.push(utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, templateMap, category));
			});

			return result;
		});
		var merged = [];
		return merged.concat.apply(merged, template);
	} else if (reactNode.type == Shift.CategoryNameFor.type){
		if(!categoryName){
			throw new Error("CategoryNameFor must be used inside a CategoryFor node, and outside a FieldsFor node");
		}
		return React.DOM[reactNode.props.tagName || 'span'](null, categoryName);
	} else {
		var children;
		if (['number','string', 'boolean'].indexOf(typeof(reactNode)) >= 0){
			// For strings and all that funky stuff
			return reactNode;
		} else if(Array.isArray(reactNode.props.children)){
			var children = [];
			React.Children.forEach(reactNode.props.children, function(child){
				children.push(utils.templateHelper.replaceImplicitFields(child, implicitFields, implicitCategories, categories, templateMap, categoryName));
			});
		} else if(reactNode.props.children != null) {
			children = utils.templateHelper.replaceImplicitFields(reactNode.props.children, implicitFields, implicitCategories, categories, templateMap, categoryName);
		}

		return utils.templateHelper.cloneNodeWithNewProperties(reactNode, reactNode.props, children);
	}
};

Shift.FieldsFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});
Shift.CategoryFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});
Shift.CategoryNameFor = React.createClass({render: function(){throw new Error("Should not be rendered")}});

utils.templateHelper = function(template, fieldNames, categoryForField, templateMap){
	// First replace all fields that are stated explicitly in the template
	var explicitFields = [];
	var explicitCategories = [];
	var replacedFields = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, template, templateMap);

	// Find every field that was not explicitly stated and mark them as implicit
	var implicitFields = [];
	var implicitCategories = [];

	var categories = {};
	for(var i in fieldNames){
		var fieldName = fieldNames[i];
		if(explicitFields.indexOf(fieldName) < 0){
			var categoryName = categoryForField(fieldName);

			if(categoryName){
				var category = categories[categoryName];

				if(!category){
					category = categories[categoryName] = [];
				}

				if(explicitCategories.indexOf(categoryName) < 0 && implicitCategories.indexOf(categoryName) < 0){
					implicitCategories.push(categoryName);
				}

				category.push(fieldName);
			} else {
				implicitFields.push(fieldName);
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

utils.templateHelper.replaceExplicitFields = function(explicitFields, explicitCategories, reactNode, templateMap, explicitFieldName){
	var fieldName;
	if(Shift.FieldsFor.type == reactNode.type){
		return reactNode;
	}

	if(Shift.CategoryFor.type == reactNode.type){
		var categoryName = reactNode.props.category;
		if(categoryName){
			explicitCategories.push(categoryName);
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
			explicitFields.push(fieldName);
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
			children.push(utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, child, templateMap, explicitFieldName));
		});
	} else if(reactNode.props.children != null) {
		children = utils.templateHelper.replaceExplicitFields(explicitFields, explicitCategories, reactNode.props.children, templateMap, explicitFieldName);
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
				result.push(utils.templateHelper.replaceExplicitFields([], [], child, templateMap, field));
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

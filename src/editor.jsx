Shift.Editors = {};

Shift.Editor = ShiftEditor = createReactClass({
	componentDidMount: function() {
		this.props.addRef(this.props.fieldName, this.refs.editor);
	},
	componentWillUnmount: function() {
		this.props.removeRef(this.props.fieldName, this.props.clearValueOnUnmount);
	},
	getEditor: function() {
		return this.refs.editor;
	},
	render: function() {
		var props = utils.extend({}, this.props, { ref: 'editor' });
		var initVal = this.props.initialValue();
		if (initVal !== undefined) {
			props.initialValue = initVal;
		} else {
			delete props.initialValue;
		}
		delete props.child;
		delete props.fieldName;
		delete props.addRef;
		delete props.removeRef;
		return React.cloneElement(this.props.child, props);
	},
});

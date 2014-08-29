Shift.Editors = {}

Shift.Editor = React.createClass({
	componentDidMount: function(){
		this.props.addRef(this.props.fieldName, this.refs.editor);
	},
	componentWillUnmount: function(){
		this.props.removeRef(this.props.fieldName);
	},
	getEditor: function(){
		return this.refs.editor;
	},
	render: function(){
		var props = utils.extend({}, this.props, {ref: 'editor'});
		delete props.child;
		delete props.fieldName;
		delete props.addRef;
		delete props.removeRef;
		return React.addons.cloneWithProps(this.props.child, props);
	}
})

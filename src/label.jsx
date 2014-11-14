Shift.LabelFor = React.createClass({
	displayName: 'ShiftLabelFor',
	render: function(){throw new Error("Should not be rendered")}
});
Shift.Label = React.createClass({
	displayName: 'ShiftLabel',
	getDefaultProps: function() {
		return {
			tagName: 'label',
			className: ''
		};
	},
	render: function(){
		var props = {
			className: this.props.className
		}
		if (this.props.tagName == 'label'){
			props.htmlFor = this.props.editorId
		}
		return React.DOM[this.props.tagName](props, this.props.text);
	}
});

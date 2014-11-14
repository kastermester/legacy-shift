Shift.ValidationClassStatusFor = React.createClass({
	displayName: 'ShiftValidationClassStatusFor',
	render: function(){throw new Error("Should not be rendered")}
});
Shift.ValidationClassStatus = React.createClass({
	displayName: 'ShiftValidationClassStatus',
	getDefaultProps: function() {
		return {
			tagName: 'div',
			className: ''
		};
	},
	render: function(){
		return React.DOM[this.props.tagName]({
			className: this.props.className
		}, this.props.children);
	}
});

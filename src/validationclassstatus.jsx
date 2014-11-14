Shift.ValidationClassStatusFor = ShiftValidationClassStatusFor = React.createClass({
	render: function(){throw new Error("Should not be rendered")}
});
Shift.ValidationClassStatus = ShiftValidationClassStatus = React.createClass({
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

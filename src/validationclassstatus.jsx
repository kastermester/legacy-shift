Shift.ValidationClassStatusFor = ShiftValidationClassStatusFor = createReactClass({
	render: function() {
		throw new Error('Should not be rendered');
	},
});
Shift.ValidationClassStatus = ShiftValidationClassStatus = createReactClass({
	getDefaultProps: function() {
		return {
			tagName: 'div',
			className: '',
		};
	},
	render: function() {
		return DOM[this.props.tagName](
			{
				className: this.props.className,
			},
			this.props.children
		);
	},
});

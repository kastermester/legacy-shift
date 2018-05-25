Shift.TitleFor = ShiftTitleFor = createReactClass({
	render: function() {
		throw new Error('Should not be rendered');
	},
});
Shift.Title = ShiftTitle = createReactClass({
	getDefaultProps: function() {
		return {
			tagName: 'span',
			className: '',
		};
	},
	render: function() {
		return DOM[this.props.tagName](
			{
				className: this.props.className,
			},
			this.props.text
		);
	},
});

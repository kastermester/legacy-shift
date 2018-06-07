Shift.LabelFor = ShiftLabelFor = createReactClass({
	render: function() {
		throw new Error('Should not be rendered');
	},
});
Shift.Label = ShiftLabel = createReactClass({
	getDefaultProps: function() {
		return {
			tagName: 'label',
			className: '',
		};
	},
	render: function() {
		var props = {
			className: this.props.className,
		};
		if (this.props.tagName == 'label') {
			props.htmlFor = this.props.editorId;
		}
		return DOM[this.props.tagName](props, this.props.text);
	},
});

Shift.TitleFor = React.createClass({
	displayName: 'ShiftTitleFor',
	render: function(){throw new Error("Should not be rendered")}
});
Shift.Title = React.createClass({
	getDefaultProps: function() {
		return {
			tagName: 'span',
			className: ''
		};
	},
	render: function(){
		return React.DOM[this.props.tagName]({
			className: this.props.className
		}, this.props.text);
	}
});

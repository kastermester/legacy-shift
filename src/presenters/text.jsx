Shift.Presenters.Text = ShiftTextPresenter = React.createClass({
	getDefaultProps: function(){
		return {
			value: '',
			className: ''
		};
	},
	render: function(){
		return React.DOM.span({
			className: this.props.className
		},this.props.value);
	},
});

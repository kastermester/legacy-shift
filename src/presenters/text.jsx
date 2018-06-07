Shift.Presenters.Text = ShiftTextPresenter = createReactClass({
	getDefaultProps: function() {
		return {
			value: '',
			className: '',
		};
	},
	render: function() {
		return <span className={this.props.className}>{this.props.value}</span>;
	},
});

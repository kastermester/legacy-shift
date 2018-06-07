Shift.Editors.TextArea = ShiftTextAreaEditor = createReactClass({
	mixins: [Shift.Mixins.events, Shift.Mixins.disabledEditorSupport, Shift.Mixins.translate],
	getDefaultProps: function() {
		return {
			initialValue: '',
			className: '',
			extraClassName: '',
			disabled: false,
			placeholderText: '',
		};
	},
	propTypes: {
		initialValue: PropTypes.string,
		className: PropTypes.string,
		extraClassName: PropTypes.string,
		placeholderText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	},
	getInitialState: function() {
		return {
			enabled: true,
			value: this.props.initialValue,
		};
	},
	render: function() {
		return (
			<textarea
				ref="field"
				value={this.state.value}
				onChange={this.valueChanged}
				onFocus={this.fieldFocused}
				onBlur={this.fieldBlurred}
				maxLength={this.props.maxLength}
				className={utils.mergeClassNames(this.props.className, this.props.extraClassName)}
				tabIndex={this.props.tabIndex}
				disabled={this.props.disabled || this.state.disabled}
				placeholder={this.translate(this.props.placeholderText)}
				id={this.props.editorId}
			/>
		);
	},

	setValue: function(value) {
		this.setState({ value: value });
	},

	getValue: function() {
		return this.state.value;
	},

	valueChanged: function(e) {
		var oldValue = this.state.value;
		var newValue = e.target.value;

		if (oldValue != newValue) {
			this.setState({ value: newValue }, function() {
				this.triggerEvent('onChange', [oldValue, newValue]);
			});
		}
	},

	fieldBlurred: function() {
		this.triggerEvent('onBlur', []);
	},

	fieldFocused: function() {
		this.triggerEvent('onFocus', []);
	},

	focus: function() {
		this.refs.field.focus();
		this.fieldFocused();
	},

	blur: function() {
		this.refs.field.blur();
		this.fieldBlurred();
	},

	select: function() {
		this.refs.field.select();
	},
});

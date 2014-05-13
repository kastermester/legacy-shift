Shift.Editors.Text = React.createClass({
	mixins: [Shift.Mixins.events],
	getDefaultProps: function(){
		return {
			value: '',
			className: '',
			disabled: false
		};
	},
	getInitialState: function(){
		return {
			enabled: true
		}
	},
	render: function(){
		return React.DOM.input({
			type: "text",
			ref: "field",
			value: this.props.value,
			onChange: this.valueChanged,
			onFocus: this.fieldFocused,
			onBlur: this.fieldBlurred,
			maxLength: this.props.maxLength,
			className: this.props.className,
			tabIndex: this.props.tabIndex,
			disabled: this.props.disabled || !this.state.enabled,
			id: this.props.editorId
		});
	},

	valueChanged: function(){
		var oldValue = this.props.value;
		var newValue = this.refs.field.getDOMNode().value;

		this.triggerEvent('onChange', [oldValue, newValue]);
	},

	fieldBlurred: function(){
		this.triggerEvent('onBlur', []);
	},

	fieldFocused: function(){
		this.triggerEvent('onFocus', []);
	},

	focus: function(){
		this.refs.field.getDOMNode().focus();
		this.fieldFocused();
	},

	blur: function(){
		this.refs.field.getDOMNode().blur();
		this.fieldBlurred();
	},

	select: function(){
		this.refs.field.getDOMNode().select();
	},

	enable: function(){
		this.setState({enabled: true});
	},

	disable: function(){
		this.setState({enabled: false});
	}
});

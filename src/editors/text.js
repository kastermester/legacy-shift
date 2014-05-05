Shift.Editors.Text = React.createClass({
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

	triggerEvent: function(name, args){
		if(this.props.events != null){
			if(typeof(this.props.events[name]) == 'function'){
				this.props.events[name].apply(undefined, args);
			}
		}
	},

	valueChanged: function(){
		var oldValue = this.props.value;
		var newValue = this.refs.field.getDOMNode().value;
		this.setState({
			value: newValue
		});

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

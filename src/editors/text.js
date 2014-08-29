Shift.Editors.Text = React.createClass({
	mixins: [Shift.Mixins.events],
	getDefaultProps: function(){
		return {
			initialValue: '',
			className: '',
			extraClassName: '',
			disabled: false,
			placeholderText: ''
		};
	},
	propTypes: {
		initialValue: React.PropTypes.string,
		className: React.PropTypes.string,
		extraClassName: React.PropTypes.string,
		disabled: React.PropTypes.bool,
		placeholderText: React.PropTypes.string
	},
	getInitialState: function(){
		return {
			enabled: true,
			value: this.props.initialValue
		}
	},
	render: function(){
		return React.DOM.input({
			type: "text",
			ref: "field",
			value: this.state.value,
			onChange: this.valueChanged,
			onFocus: this.fieldFocused,
			onBlur: this.fieldBlurred,
			maxLength: this.props.maxLength,
			className: utils.mergeClassNames(this.props.className, this.props.extraClassName),
			tabIndex: this.props.tabIndex,
			disabled: this.props.disabled || !this.state.enabled,
			placeholder: this.props.placeholderText,
			id: this.props.editorId
		});
	},

	setValue: function(value){
		this.setState({value: value});
	},

	getValue: function(){
		return this.state.value;
	},

	valueChanged: function(){
		var oldValue = this.state.value;
		var newValue = this.refs.field.getDOMNode().value;

		if(oldValue != newValue){
			this.setState({value: newValue}, function(){
				this.triggerEvent('onChange', [oldValue, newValue]);
			});
		}
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

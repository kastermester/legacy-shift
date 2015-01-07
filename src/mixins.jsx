Shift.Mixins = {
	events: {
		triggerEvent: function(name, args){
			if(this.props.events != null){
				if(typeof(this.props.events[name]) == 'function'){
					return this.props.events[name].apply(this.props.eventHandlerContext || undefined, args);
				}
			}
			return null;
		}
	},
	translate: {
		translate: function(str){
			if(typeof(str) == 'string'){
				return str;
			}

			if(typeof(str) == 'object'){
				return str[this.props.locale];
			}

			throw new Error("str must either be a string or a map from locale to a string");
		}
	},
	disabledEditorSupport: {
		propTypes: {
			disabled: React.PropTypes.bool
		},
		getInitialState: function(){
			return { disabled: false };
		},
		isDisabled: function(){
			return this.props.disabled || this.state.disabled;
		},
		isEnabled: function(){
			return !this.isDisabled();
		},
		disable: function(){
			var extraState = {};
			if(typeof(this.extraDisableState) == 'function'){
				extraState = this.extraDisableState();
			}
			var state = utils.extend({}, this.disabledStateObject, extraState);
			this.setState(state);
		},
		enable: function(){
			var extraState = {};
			if(typeof(this.extraEnableState) == 'function'){
				extraState = this.extraEnableState();
			}
			var state = utils.extend({}, this.enabledStateObject, extraState);
			this.setState(state);
		},
		disabledStateObject: {
			disabled: true
		},
		enabledStateObject: {
			disabled: false
		},
	}
}

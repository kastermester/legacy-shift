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
	}
}

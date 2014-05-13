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
	}
}

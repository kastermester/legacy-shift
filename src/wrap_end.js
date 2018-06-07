return Shift;
});

if (typeof define === "function" && define.amd) {
	define("shift", ["react", "create-react-class", "prop-types", "react-dom-factories"], function (React, createReactClass, PropTypes, DOM) {
		return load(window, React, createReactClass, PropTypes, DOM);
	});
} else {
	throw new Error('`define` not defined');
}

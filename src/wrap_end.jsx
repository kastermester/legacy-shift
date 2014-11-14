return Shift;
});

if (typeof define === "function" && define.amd) {
	define("shift", ["react"], function(React) {
		return load(window, React);
	});
} else {
	load(window, React);
}

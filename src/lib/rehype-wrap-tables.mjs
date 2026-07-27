/**
 * Rehype plugin that wraps every <table> element in a
 * <div class="table-wrapper"> so the parent div can carry
 * `overflow-x: auto` and tables scroll horizontally on narrow viewports
 * instead of breaking the page layout.
 */
export function rehypeWrapTables() {
	return (tree) => {
		visit(tree);
	};
}

function visit(node) {
	if (!node.children) return;

	for (let i = 0; i < node.children.length; i++) {
		const child = node.children[i];
		if (child.type === "element" && child.tagName === "table") {
			node.children[i] = {
				type: "element",
				tagName: "div",
				properties: { className: ["table-wrapper"] },
				children: [child],
			};
		} else {
			visit(child);
		}
	}
}

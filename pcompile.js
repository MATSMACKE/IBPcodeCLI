let fs = require('fs');
let path = require('path');
let fork = require("child_process").fork;

let inputs = 0

let project_folder;
if (process.pkg) {
    project_folder = path.dirname(process.execPath);
}
else {
    project_folder = __dirname;
}

let datafile = process.argv[2]

let program = fs.readFileSync(path.join(project_folder, datafile)).toString().split("\n");


function translate(line) {
	line = line.trimStart();
	line = line.replace(/ mod /g, " % ");

	line = line.replace(/ AND /g, " && ");
	line = line.replace(/ OR /g, " || ");

	line = line.replace(/NOT/g, "!");
	line = line.replace(/<>/g, "!=");
	line = line.replace(/ = /g, " == ");

	line = line.replace(/ then/, ") {")

	let sp = line.indexOf(" ");
	let first = "";

	if (line.startsWith("if")) {
		first = "if";
	} 
	else if (line.startsWith("else if")) {
		first = "else if";
	} 
	else if (line.startsWith("else")) {
		first = "else";
	} 
	else if (line.startsWith("loop for")) {
		first = "loop while";
	} 
	else if (line.startsWith("loop for")) {
		first = "loop for";
	} 
	else if (line.startsWith("loop until")) {
		first = "loop until";
	} 
	else if (line.startsWith("loop ")) {
		first = "loop";
	} 
	else if (line.startsWith("loop for")) {
		first = "output";
	} 
	else if (line.startsWith("method")) {
		first = "method";
	} 
	else if (line.startsWith("Class")) {
		first = "class";
	} 
	else if (line.startsWith("input")) {
		first = "input";
	} 
	else {
		if (sp >= 0) {
			first = line.substring(0, sp);
		}
	}
	if (first == "if" || first == "else if") {
		line = line.replace("if ", "if (");
		if (first == "else if") {
			line = line.replace("else if", "} \nelse if");
		}
	}
	if (first == "else") {
		line = line.replace("else", "}\nelse{");
	}
	if (first == "loop while") {
		line = line.replace("loop while", "while(") + "){";
	}
	if (first == "loop for") {
		let v = line.indexOf("loop for") + 9;
		let ve = line.indexOf(" ", v);
		let vname = line.substring(v, ve);

		let vs = line.indexOf(" from ") + 6;
		let vt = line.indexOf(" to ");
		let vstart = line.substring(vs, vt);

		let vend = line.substring(vt + 4);

		line =
			"for(" +
			vname +
			"=" +
			vstart +
			";" +
			vname +
			"<=" +
			vend +
			";" +
			vname +
			"++){";
	}
	if (first == "loop until") {
		line = line.replace("loop until", "while(!(") + ")){";
	}
	if (first == "loop") {
		let v = line.indexOf("loop") + 5;
		let ve = line.indexOf(" ", v);
		let vname = line.substring(v, ve);

		let vs = line.indexOf(" from ") + 6;
		let vt = line.indexOf(" to ");
		let vstart = line.substring(vs, vt);

		let vend = line.substring(vt + 4);

		line =
			"for(let " +
			vname +
			" = " +
			vstart +
			"; " +
			vname +
			" <= " +
			vend +
			"; " +
			vname +
			"++) {";
	}
	if (first == "end") {
		line = "}";
	}
	if (first == "output") {
		line = line.replace(/output /, "console.log(") + ")"
	}
	if (first == "input") {
		inputs++
		line = `let ${line.replace(/input /, '') + ""}\nrl.question("${line.replace(/input /, '') + ": "}", function(val) {\n${line.replace(/input /, '')} = isNaN(val) ? val : Number(val)`
	}
	if (first == "method") {
		line = line.replace(/method/, "function") + "{";
	}

	if (first == "class") {
		line = line.replace(/Class/, "function") + "{";
	}

	return line;
}

for (line in program) {
	program[line] = translate(program[line])
}

program.unshift(`const readline = require("readline");const rl = readline.createInterface({input:process.stdin,output: process.stdout})`)

program.push("rl.close()")

while (inputs > 0) {
	program.push("})")

	inputs--
}

program.push(`rl.on("close", function() {process.exit(0);console.log('')})`)

fs.writeFile(path.join(project_folder, "out.js"), program.join("\n"), 'utf8', function(err, data){
	console.log("\nProgram saved to 'out.js'\n");

	fork("./out.js")
});
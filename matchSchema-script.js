
// interface GradingResult {
//   pass: boolean;
//   score: number;
//   reason: string;
//   componentResults?: GradingResult[];
// }

function matchesSchema(output, context) {
  
  const schemaPath = context.config.schemaPath;
  
  if (!schemaPath) {
    return {
      pass: false,
      score: 0,
      reason: 'Schema path not provided',
    };
  }
  
  let jsonObject;

  try {
    const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      return {
        pass: false,
        score: 0,
        reason: 'No JSON code block found in output',
      };
    }
    jsonObject = JSON.parse(jsonMatch[1]);
  } catch (e) {
    return {
      pass: false,
      score: 0,
      reason: `Failed to parse JSON from output: ${e.message}`,
    };
  }

  const Ajv = require("ajv")
  const schema = require(schemaPath)
  
  // console.log("output", output)
  // console.log("schema", JSON.stringify(schema, null, 2))
  // console.log("jsonObject", JSON.stringify(jsonObject, null, 2))

  const ajv = new Ajv()
  const validate = ajv.compile(schema)
  const valid = validate(jsonObject)
  
  // console.log("valid", valid)
  // console.log("errors", JSON.stringify(validate.errors, null, 2))
  
  if (!valid) {
    return {
      pass: false,
      score: 0,
      reason: `JSON does not match schema: ${validate.errors.map(e => e.message).join(', ')}`,
    };
  }


  return true;
}

module.exports = { matchesSchema };

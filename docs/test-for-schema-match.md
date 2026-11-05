# Test for Schema Match

This script validates that the output matches a given JSON schema.

It assumes that the Agent is  outputting like this:
"""
```json
{
    "prop": "value",
    "anotherProp": ["anotherValue"],
    "yetAnotherProp": 123,
    "nestedObject": {
        "innerProp": "innerValue"
    }
}
```
"""

That includes the backticks and the ```json``` header.
The script should extract the JSON from the output and validate it against the schema.

Use https://jsonjson.com/json-to-schema to convert an example object to a schema.


## Implementation

```yaml
- vars:
    request: "Your Prompt"
  description: 'Test Description'
  assert:
    - type: javascript
      value: file://./matchSchema-script.js:matchesSchema
      config:
        schemaPath: './your-schema.json' # path relative to promptfooconfig file.
```
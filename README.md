# Reproductions of issues with Gemini 2.5 pro

## Unescaped newlines

`unescaped_newline.js` contains a semi-consistent reproduction of an issue where a newline in a go string is being generated as an unescaped newline, generating invalid go syntax.

To run, `GEMINI_API_KEY=<key> node unescaped_newline.js | jq`. If there is output, that means the bug was detected and the offending strings are printed to the console. You will see format strings that contain literal newlines rather than escaped newlines.

This one usually triggers ~50% of the time for me, so you may need to run it a few times.

## Leading backslash

Some tool calls respond with generated args that start with a leading backslash.

To run, `GEMINI_API_KEY=<key> node leading_backslash.js`. If there is output, that means the bug was detected and a prefix of the offending string is printed to the console.

This one triggers more consistently, like 80% of the time for me.

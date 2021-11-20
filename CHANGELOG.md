# 4.0.0

API update to support "Source" inputs that can improve syntax error handling.

# 3.0.3 (3.0.1 - 3.0.3 inclusive) October 30, 2021 - November 4, 2021

Dependency updates for security.

# 3.0.0

Remove support for nodejs 10.

# 2.4.5 (2.4.1 -> 2.4.5 inclusive) September 23, 2021

Updated vendor dependencies, housekeeping in that regard.
Removed nodejs version 8 support in build tooling. It may still
work in usage though (untested).

# 2.4.0 August 5, 2021

Added support for inline fragments

# 2.3.0 April 1, 2021

Added support for return type of array set to enum values

# 2.2.0 November 6, 2020

Added support for inline fragments and union types in graphql. Union types are
converted to `anyOf` types in the openapi schema.

# 2.1.1 November 3, 2020

Fixed bug. Aliased fields in graphql queries were not properly processed.

# 2.1.0 October 24, 2020

Added support for yaml output via the command-line.

# 2.0.0 October 24, 2020

Added support for openapi 3.0.3 specification.

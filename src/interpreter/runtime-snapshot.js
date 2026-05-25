import {
  getBindingType,
  getBindingValue,
  snapshotBindingValue
} from './scope-bindings.js';
import { formatType } from './vectors.js';

export function snapshotRuntimeVariables(runtime) {
  const variables = {};
  for (const scope of runtime.scopes) {
    for (const [name, value] of scope.values.entries()) {
      variables[name] = snapshotBindingValue(value, scope.types.get(name));
    }
    for (const [name, binding] of scope.aliases.entries()) {
      variables[name] = snapshotBindingValue(getBindingValue(binding), getBindingType(binding));
    }
  }
  return variables;
}

export function snapshotRuntimeVariableTypes(runtime) {
  const variableTypes = {};
  for (const scope of runtime.scopes) {
    for (const name of scope.values.keys()) {
      variableTypes[name] = formatType(scope.types.get(name));
    }
    for (const [name, binding] of scope.aliases.entries()) {
      variableTypes[name] = formatType(getBindingType(binding));
    }
  }
  return variableTypes;
}

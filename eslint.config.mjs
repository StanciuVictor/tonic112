import nx from "@nx/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";


export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  eslintConfigPrettier,
  {
    ignores: [
      "**/dist",
      "**/out-tsc"
    ]
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.js",
      "**/*.jsx"
    ],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: [
            "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"
          ],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: [
                "*"
              ]
            }
          ]
        }
      ],
      "curly": ["error", "all"]
    }
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs"
    ],
    // Override or add rules here
    rules: {}
  }
];

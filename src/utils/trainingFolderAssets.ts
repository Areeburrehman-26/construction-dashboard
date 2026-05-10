const imagePattern = "../../ppe/**/*.{png,jpg,jpeg,gif,webp,svg}" as const;

type ImageEntry = {
  name: string;
  url: string;
};

function entriesFromGlob(
  modules: Record<string, string>,
): ImageEntry[] {
  return Object.entries(modules)
    .map(([path, url]) => ({
      name: path.replace(/^.*\//, ""),
      url,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

const ppeModules = import.meta.glob<string>(imagePattern, {
  eager: true,
  query: "?url",
  import: "default",
});

const crackModules = import.meta.glob<string>(
  "../../crack/**/*.{png,jpg,jpeg,gif,webp,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export const ppeFolderImages = entriesFromGlob(ppeModules);
export const crackFolderImages = entriesFromGlob(crackModules);

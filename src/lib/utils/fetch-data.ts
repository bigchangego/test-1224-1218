import matter from "gray-matter";

export interface Heading {
	level: number;
	value: string;
}

export interface ResourceMetadata {
	title: string;
	date: string;
	desc: string;
	tags: string[];
	demo: string;
	source: string;
	layout: string;
	stack: [string, string][];
	slug: string;
	headings: Heading[];
	content: string;
	draft: boolean;
	minimal: boolean;
	type: string;
}

export type ResourceKind = "post" | "project";

const POSTS = import.meta.glob("/data/post/**/index.svx", {
	as: "raw",
	eager: true
});
const PROJECTS = import.meta.glob("/data/project/**/index.svx", {
	as: "raw",
	eager: true
});

export const getResourcesAsync = async (kind: ResourceKind): Promise<ResourceMetadata[]> => {
	if (!kind) throw new Error("KIND IS REQUIRED!");

	const validFiles = kind === "post" ? POSTS : PROJECTS;
	const fileMetadata = Object.keys(validFiles).map(async (fileName): Promise<ResourceMetadata> => {
		const postContent = validFiles[fileName] as unknown as string;
		const { data } = matter(postContent);
		const slug = fileName.replace(new RegExp(`/data/${kind}/(.*)/index.svx`), "$1");
		const headings = postContent
			.split("\n")
			.filter((line) => {
				const startsWithHash = line.startsWith("#");
				if (!startsWithHash) return false;

				const startsWithCapitalLetter = /^[A-Z]/.test(line.split(" ")[1]);
				if (startsWithCapitalLetter) return true;

				return false;
			})
			.map((line) => {
				const level = line.match(/^#{1,5}/)[0].length;
				const value = line.replace(/^#{1,5}\s/, "");
				return {
					level: level,
					value: value,
				};
			});

		return {
			...(data as ResourceMetadata),
			slug,
			headings,
			content: postContent,
		};
	});

	const result = await Promise.all(fileMetadata);

	return result
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.filter((post) => (kind === "post" ? !post.draft : true));
};

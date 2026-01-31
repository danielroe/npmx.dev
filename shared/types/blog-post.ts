export interface BlogPost {
  author: string // Potentially Multiple?
  title: string
  topics: string[]
  content: string // MarkDown File
  published: string // DateTime
}

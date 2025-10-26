interface GitHubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  updated_at: string
  created_at: string
}

interface GitHubUser {
  login: string
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
}

const CACHE_DURATION = 1000 * 60 * 60
let reposCache: GitHubRepo[] | null = null
let userCache: GitHubUser | null = null
let cacheTime = 0

/**
 * Fetch user info from GitHub API with caching.
 * @param username - GitHub username
 * @returns User information
 */
export async function fetchUserInfo(username: string): Promise<GitHubUser> {
  if (userCache && Date.now() - cacheTime < CACHE_DURATION) {
    return userCache
  }
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  })
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`)
  }
  const user = await response.json()
  userCache = user
  cacheTime = Date.now()
  return user
}

/**
 * Fetch all repositories for a user with caching.
 * @param username - GitHub username
 * @returns Array of repositories
 */
export async function fetchAllRepos(username: string): Promise<GitHubRepo[]> {
  if (reposCache && Date.now() - cacheTime < CACHE_DURATION) {
    return reposCache
  }
  const repos: GitHubRepo[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&sort=created&direction=desc&type=all`,
      {
        headers: {
          Accept: 'application/vnd.github+json'
        }
      }
    )
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }
    const pageRepos: GitHubRepo[] = await response.json()
    if (pageRepos.length === 0) {
      break
    }
    repos.push(...pageRepos)
    if (pageRepos.length < perPage) {
      break
    }
    page++
  }
  reposCache = repos
  cacheTime = Date.now()
  return repos
}

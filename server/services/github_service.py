import httpx

async def get_github_data(username: str):
    async with httpx.AsyncClient() as client:
        # Fetch Profile
        user_res = await client.get(f"https://api.github.com/users/{username}")
        if user_res.status_code != 200:
            raise Exception("User not found")
            
        user_data = user_res.json()
        
        # Fetch Repos
        repo_res = await client.get(f"https://api.github.com/users/{username}/repos?sort=pushed&per_page=5")
        repos_data = repo_res.json()
        
        # Structure data
        structured = {
            "name": user_data.get("name"),
            "bio": user_data.get("bio"),
            "location": user_data.get("location"),
            "repos": [
                {
                    "name": r["name"],
                    "desc": r["description"],
                    "lang": r["language"],
                    "stars": r["stargazers_count"]
                } for r in repos_data
            ]
        }
        return structured
import requests

# Replace YOUR_GITHUB_USERNAME with your GitHub username
GITHUB_USERNAME = "YOUR_GITHUB_USERNAME"

# Replace YOUR_PERSONAL_ACCESS_TOKEN with the token you generated in step 1
PERSONAL_ACCESS_TOKEN = "YOUR_PERSONAL_ACCESS_TOKEN"

API_BASE_URL = "https://api.github.com"

def get_all_repos():
    url = f"{API_BASE_URL}/users/{GITHUB_USERNAME}/repos"
    headers = {"Authorization": f"token {PERSONAL_ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    return response.json()

def delete_repo(repo):
    url = f"{API_BASE_URL}/repos/{GITHUB_USERNAME}/{repo['name']}"
    headers = {"Authorization": f"token {PERSONAL_ACCESS_TOKEN}"}
    response = requests.delete(url, headers=headers)
    return response.status_code == 204

def main():
    repos = get_all_repos()
    print(f"Found {len(repos)} repositories")

    for repo in repos:
        success = delete_repo(repo)
        if success:
            print(f"Deleted {repo['name']}")
        else:
            print(f"Failed to delete {repo['name']}")

if __name__ == "__main__":
    main()

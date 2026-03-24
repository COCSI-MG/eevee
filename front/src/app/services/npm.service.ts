import axios from "axios";

export interface NpmPackage {
  name: string;
  version: string;
  description: string;
}

export interface NpmSearchResult {
  package: {
    name: string;
    version: string;
    description: string;
    links?: {
      npm?: string;
      homepage?: string;
      repository?: string;
    };
  };
  score: {
    final: number;
  };
}

export class NpmService {
  private static readonly NPM_REGISTRY_SEARCH_URL =
    "https://registry.npmjs.org/-/v1/search";
  private static readonly NPM_REGISTRY_PACKAGE_URL =
    "https://registry.npmjs.org";

  /**
   * Search for npm packages by query
   * @param query - Search query string
   * @param size - Number of results to return (default: 10)
   */
  static async searchPackages(
    query: string,
    size: number = 10
  ): Promise<NpmPackage[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await axios.get<{
        objects: NpmSearchResult[];
        total: number;
      }>(this.NPM_REGISTRY_SEARCH_URL, {
        params: {
          text: query,
          size,
        },
        timeout: 5000,
      });

      return response.data.objects.map((result) => ({
        name: result.package.name,
        version: result.package.version,
        description: result.package.description || "No description available",
      }));
    } catch (error) {
      console.error("Failed to search npm packages:", error);
      return [];
    }
  }
}

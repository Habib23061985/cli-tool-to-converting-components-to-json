import axios, { AxiosInstance } from 'axios';

export class FigmaAPI {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': token,
      },
    });
  }

  async getFile(fileId: string) {
    const response = await this.client.get(`/files/${fileId}`);
    return response.data;
  }

  async getComponents(fileId: string) {
    const response = await this.client.get(`/files/${fileId}/components`);
    return response.data.meta.components || [];
  }

  async getNode(fileId: string, nodeId: string) {
    const response = await this.client.get(`/files/${fileId}/nodes?ids=${nodeId}`);
    return response.data.nodes[nodeId];
  }

  async getImages(fileId: string, nodeIds: string[], format: string = 'svg') {
    const response = await this.client.get(`/images/${fileId}`, {
      params: {
        ids: nodeIds.join(','),
        format,
      },
    });
    return response.data.images;
  }
}

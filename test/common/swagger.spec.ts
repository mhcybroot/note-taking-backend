import { DocumentBuilder } from '@nestjs/swagger';

describe('Swagger Configuration', () => {
  it('should build OpenAPI document with Bearer auth and API metadata', () => {
    const config = new DocumentBuilder()
      .setTitle('Secure Note-Taking API')
      .setDescription('Production REST API with Clean Layered Architecture')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    expect(config.info.title).toBe('Secure Note-Taking API');
    expect(config.components?.securitySchemes).toHaveProperty('bearer');
  });
});

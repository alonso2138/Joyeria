const API_URL = 'http://localhost:5000/api';

async function verifyConfigSecurity() {
    console.log('--- Verifying Config Security ---');
    try {
        const response = await fetch(`${API_URL}/config`);
        const config = await response.json() as any;

        const forbiddenFields = ['demoConfigs', 'aiPrompts', 'saasPlans'];
        forbiddenFields.forEach(field => {
            if (config[field]) {
                console.error(`❌ FAILED: Field "${field}" should not be exposed.`);
            } else {
                console.log(`✅ SUCCESS: Field "${field}" is hidden.`);
            }
        });

        if (config.branding && config.uiLabels) {
            console.log('✅ SUCCESS: Public branding/labels are exposed.');
        } else {
            console.error('❌ FAILED: Public fields missing.');
        }

        if (config.linkedApiKey) {
            console.error('❌ FAILED: linkedApiKey should not be returned without a tag.');
        } else {
            console.log('✅ SUCCESS: linkedApiKey hidden when no tag provided.');
        }
    } catch (e: any) {
        console.error('❌ Error testing config:', e.message);
    }
}

async function verifyAIAuthorization() {
    console.log('\n--- Verifying AI Authorization ---');
    try {
        // Test with a tag that doesn't have an organization (unlinked demo)
        const response = await fetch(`${API_URL}/ai/generate-tryon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag: 'unlinked-demo-tag',
                userImageBase64: 'data:image/jpeg;base64,AAA',
                jewelryOverlayUrl: 'http://example.com/asset.png',
                itemType: 'ring'
            })
        });

        if (response.status === 403) {
            console.log('✅ SUCCESS: AI generation blocked for unlinked demos (403 Forbidden).');
        } else if (response.status === 200) {
            console.error('❌ FAILED: AI generation should be blocked but returned 200.');
        } else {
            console.log(`ℹ️ INFO: AI generation returned status ${response.status} (likely due to missing Org in DB).`);
        }
    } catch (e: any) {
        console.error('❌ Error testing AI:', e.message);
    }
}

async function run() {
    await verifyConfigSecurity();
    await verifyAIAuthorization();
}

run();

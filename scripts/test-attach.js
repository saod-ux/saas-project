const fetch = require('node-fetch')

async function testAttach() {
  try {
    console.log('🧪 Testing attach endpoint...\n')
    
    // Test data from the debug output
    const fileId = 'cmf0murvb0007e48fs2ke95wo' // First file from debug
    const productId = 'cmf0mkdba0003e48fsrx5uwev' // "hi" product from debug
    
    console.log('📤 Sending attach request:')
    console.log('  File ID:', fileId)
    console.log('  Product ID:', productId)
    console.log('  Tenant Slug: demo-store')
    console.log('')
    
    const response = await fetch('http://localhost:3000/api/v1/uploads/attach-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': 'demo-store'
      },
      body: JSON.stringify({
        fileId: fileId,
        productId: productId
      })
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log('📥 Response body:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('✅ Attach successful!')
    } else {
      console.log('❌ Attach failed!')
    }
    
  } catch (error) {
    console.error('❌ Error testing attach:', error)
  }
}

testAttach()

















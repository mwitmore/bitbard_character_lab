import axios from 'axios';

const SERVER_PORT = 3000;
const AGENT_ID = '6abb2b06-2083-0114-a00a-e9cc14bdbc0a';

async function simpleDiagnostic() {
  console.log('🔍 SIMPLE ELIZA DIAGNOSTIC');
  console.log('==========================\n');
  
  console.log(`Server: http://localhost:${SERVER_PORT}`);
  console.log(`Agent ID: ${AGENT_ID}\n`);

  // Test 1: Basic server connection
  console.log('1. Testing basic server connection...');
  try {
    const response = await axios.get(`http://localhost:${SERVER_PORT}/`, { timeout: 3000 });
    console.log(`   ✅ Server responds: ${response.status}\n`);
  } catch (error) {
    console.log(`   ❌ Server connection failed: ${error.message}\n`);
    return;
  }

  // Test 2: Simple message with short timeout
  console.log('2. Testing simple message (short timeout)...');
  try {
    const startTime = Date.now();
    const response = await axios.post(`http://localhost:${SERVER_PORT}/${AGENT_ID}/message`, {
      text: "Hi",
      roomId: "diagnostic-room",
      userId: "diagnostic-user"
    }, { 
      timeout: 3000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const endTime = Date.now();
    console.log(`   ✅ Response received in ${endTime - startTime}ms`);
    console.log(`   📄 Status: ${response.status}`);
    console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log(`   ⏰ Request timed out after 3 seconds`);
    } else {
      console.log(`   ❌ Request failed: ${error.message}`);
      if (error.response) {
        console.log(`   📄 Status: ${error.response.status}`);
        console.log(`   📄 Data:`, error.response.data);
      }
    }
  }
  
  console.log('\n3. Testing with longer timeout...');
  try {
    const startTime = Date.now();
    const response = await axios.post(`http://localhost:${SERVER_PORT}/${AGENT_ID}/message`, {
      text: "testing",
      roomId: "diagnostic-room-2",
      userId: "diagnostic-user-2"
    }, { 
      timeout: 30000, // 30 seconds
      headers: { 'Content-Type': 'application/json' }
    });
    
    const endTime = Date.now();
    console.log(`   ✅ Response received in ${endTime - startTime}ms`);
    console.log(`   📄 Status: ${response.status}`);
    console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log(`   ⏰ Request timed out after 30 seconds`);
      console.log(`   ⚠️  This suggests the agent is hanging during message processing`);
    } else {
      console.log(`   ❌ Request failed: ${error.message}`);
      if (error.response) {
        console.log(`   📄 Status: ${error.response.status}`);
        console.log(`   📄 Data:`, error.response.data);
      }
    }
  }

  console.log('\n🔧 DIAGNOSIS COMPLETE');
  console.log('====================');
  console.log('If requests are timing out, the agent may be:');
  console.log('• Hanging during message processing');
  console.log('• Having issues with the DeepSeek API');
  console.log('• Encountering validation errors in response generation');
  console.log('• Stuck in a retry loop');
  console.log('\nRecommendation: Check agent logs for error details');
}

simpleDiagnostic().catch(console.error); 
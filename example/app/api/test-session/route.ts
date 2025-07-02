import { NextResponse } from 'next/server';
import { session } from '../../../lib/session';

export async function GET() {
  const sess = session();

  // Test 1: Get individual values without calling all() first
  console.log('Test 1: Individual gets without all()');
  const role1 = await sess.get('role');
  const address1 = await sess.get('address');
  console.log('Role:', role1, 'Address:', address1);

  // Test 2: Call all() then get individual values
  console.log('Test 2: all() then individual gets');
  const allData = await sess.all();
  const role2 = await sess.get('role');
  const address2 = await sess.get('address');
  console.log('All data:', allData, 'Role:', role2, 'Address:', address2);

  // Test 3: Set and immediately get
  console.log('Test 3: Set and immediate get');
  await sess.set('testKey', 'testValue');
  const testValue = await sess.get('testKey');
  console.log('Test value:', testValue);

  // Test 4: Multiple concurrent operations
  console.log('Test 4: Concurrent operations');
  const [role3, address3, all2, testValue2] = await Promise.all([
    sess.get('role'),
    sess.get('address'),
    sess.all(),
    sess.get('testKey')
  ]);
  console.log('Concurrent results:', { role3, address3, all2, testValue2 });

  // Test 5: Get single value then call all()
  console.log('Test 5: Single get then all()');
  const role4 = await sess.get('role');
  const all3 = await sess.all();
  console.log('Role:', role4, 'All:', all3);

  // Test 6: Multiple gets in sequence
  console.log('Test 6: Sequential gets');
  const role5 = await sess.get('role');
  const address5 = await sess.get('address');
  const testValue3 = await sess.get('testKey');
  console.log('Sequential:', { role5, address5, testValue3 });

  return NextResponse.json({
    test1: { role: role1, address: address1 },
    test2: { allData, role: role2, address: address2 },
    test3: { testValue },
    test4: { role: role3, address: address3, all: all2, testValue: testValue2 },
    test5: { role: role4, all: all3 },
    test6: { role: role5, address: address5, testValue: testValue3 },
    success: true
  });
}

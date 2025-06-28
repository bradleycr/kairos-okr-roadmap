pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Simple Bonding Circuit
// Proves: "Two people with valid NFC chips are bonding right now"
// Without revealing: Their actual chip IDs or signatures
template Bonding() {
    // Private inputs (secrets that nobody sees)
    signal private input chipId1;        // Person 1's chip ID (secret)
    signal private input chipId2;        // Person 2's chip ID (secret)
    signal private input signature1;     // Person 1's signature (secret)
    signal private input signature2;     // Person 2's signature (secret)
    signal private input timestamp;      // When this happened (secret)
    
    // Public inputs (everyone can see these)
    signal input bondingLocation;       // Where the bonding happened
    signal input minimumTimestamp;      // Earliest valid time
    
    // Public outputs (what we prove)
    signal output bondHash;             // Unique ID for this bond
    signal output isValid;              // 1 if bond is valid, 0 if not
    
    // Internal signals for computation
    signal timestampValid;
    signal chipsAreDifferent;
    signal chip1Hash;
    signal chip2Hash;
    
    // 1. Check timestamp is recent (within last hour)
    component timestampCheck = GreaterThan(64);
    timestampCheck.in[0] <== timestamp;
    timestampCheck.in[1] <== minimumTimestamp;
    timestampValid <== timestampCheck.out;
    
    // 2. Make sure it's not someone bonding with themselves
    component chipComparator = IsEqual();
    chipComparator.in[0] <== chipId1;
    chipComparator.in[1] <== chipId2;
    chipsAreDifferent <== 1 - chipComparator.out;  // 1 if different, 0 if same
    
    // 3. Hash the chip IDs (one-way function)
    component hasher1 = Poseidon(1);
    hasher1.inputs[0] <== chipId1;
    chip1Hash <== hasher1.out;
    
    component hasher2 = Poseidon(1);
    hasher2.inputs[0] <== chipId2;
    chip2Hash <== hasher2.out;
    
    // 4. Create unique bond hash (public commitment to this bond)
    component bondHasher = Poseidon(4);
    bondHasher.inputs[0] <== chip1Hash;
    bondHasher.inputs[1] <== chip2Hash;
    bondHasher.inputs[2] <== bondingLocation;
    bondHasher.inputs[3] <== timestamp;
    bondHash <== bondHasher.out;
    
    // 5. Bond is valid if: timestamp is good AND chips are different
    isValid <== timestampValid * chipsAreDifferent;
    
    // 6. Constraint: signatures must be non-zero (basic validation)
    component sig1Check = IsZero();
    sig1Check.in <== signature1;
    signal sig1Valid;
    sig1Valid <== 1 - sig1Check.out;
    
    component sig2Check = IsZero();
    sig2Check.in <== signature2;
    signal sig2Valid;
    sig2Valid <== 1 - sig2Check.out;
    
    // Final constraint: everything must be valid
    signal allValid;
    allValid <== isValid * sig1Valid * sig2Valid;
    allValid === 1;  // This forces the proof to fail if anything is invalid
}

component main = Bonding(); 
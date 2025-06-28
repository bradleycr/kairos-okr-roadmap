#!/bin/bash

# Build script for KairOS Bonding ZK Circuit
# This compiles the circuit and generates proving/verification keys

set -e  # Exit on any error

echo "🔧 Building KairOS Bonding ZK Circuit..."

# Create build directory
mkdir -p build/bonding

# Step 1: Compile the circuit
echo "📝 Compiling bonding.circom..."
circom circuits/bonding.circom --r1cs --wasm --sym -o build/bonding/

# Step 2: Generate trusted setup (Powers of Tau ceremony)
echo "🎲 Generating Powers of Tau (this takes a moment)..."
cd build/bonding

# Start a new powers of tau ceremony for circuits up to 2^12 constraints
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute to the ceremony (in production, this would be done by multiple parties)
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="some random text"

# Phase 2 of the ceremony
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# Step 3: Generate circuit-specific setup
echo "🔑 Generating circuit-specific keys..."
snarkjs groth16 setup bonding.r1cs pot12_final.ptau bonding_0000.zkey

# Contribute to the circuit-specific ceremony
snarkjs zkey contribute bonding_0000.zkey bonding_0001.zkey --name="1st Contributor Name" -v -e="Another random entropy"

# Export the verification key
snarkjs zkey export verificationkey bonding_0001.zkey verification_key.json

# Step 4: Generate the verifier contract (for blockchain deployment)
echo "📜 Generating Solidity verifier..."
snarkjs zkey export solidityverifier bonding_0001.zkey verifier.sol

echo "✅ Bonding circuit build complete!"
echo ""
echo "📁 Generated files:"
echo "   - build/bonding/bonding.wasm (circuit for proof generation)"
echo "   - build/bonding/bonding_0001.zkey (proving key)"
echo "   - build/bonding/verification_key.json (verification key)"
echo "   - build/bonding/verifier.sol (Solidity verifier contract)"
echo ""
echo "🚀 Ready to generate real zero-knowledge proofs!" 
import assert = require("assert");
import { Guid } from "../src/Guid";
import {XmlEncode} from '../src/XmlEncode';

describe('XmlEncode', function () {
    it('Encodes and decodes a Name that begins with a number', function () {
        var name = '1 abcdef abcdef';
        var encodedName = XmlEncode.encodeName(name);
        assert.equal(encodedName,'_x0031__x0020_abcdef_x0020_abcdef');
        var decodedName = XmlEncode.decodeName(encodedName);
        assert.equal(decodedName,name);
    });
    it('Encodes and decodes a Name that begins with a space', function () {
        var name = ' abcdef abcdef';
        var encodedName = XmlEncode.encodeName(name);
        assert.equal(encodedName,'_x0020_abcdef_x0020_abcdef');
        var decodedName = XmlEncode.decodeName(encodedName);
        assert.equal(decodedName,name);
    });
    it('Encodes and decodes a very short Name', function () {
        var name = 'a';
        var encodedName = XmlEncode.encodeName(name);
        assert.equal(encodedName,'a');
        var decodedName = XmlEncode.decodeName(encodedName);
        assert.equal(decodedName,name);
    });
    it('Encodes and decodes a very short encoded Name', function () {
        var name = '1';
        var encodedName = XmlEncode.encodeName(name);
        assert.equal(encodedName,'_x0031_');
        var decodedName = XmlEncode.decodeName(encodedName);
        assert.equal(decodedName,name);
    });
    it('Returns null for a null or empty input', function () {
        var name = null;
        var encodedName = XmlEncode.encodeName(name);
        assert.ok(encodedName===null);

        var decodedName = XmlEncode.decodeName(encodedName);
        assert.ok(decodedName === null);
    });
    
});
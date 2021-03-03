import {numberToLength} from "../src/utils/util.functions";

import {} from 'mocha';
import { expect } from 'chai';


describe('calculate', function() {
    it('add', function() {

        let result = numberToLength('1');
        expect(result).equal('  1   ');
        result = numberToLength('1.1');
        expect(result).equal('  1.1 ');
        result = numberToLength('1.11');
        expect(result).equal('  1.11');
        result = numberToLength('20');
        expect(result).equal(' 20   ');
    });
});
